import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { AuthUser } from '@/types/auth'

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // In server components, avoid PostgREST to prevent RLS/grant issues; use Prisma
    // Session should be validated at middleware level already
    // Without direct access to request cookies here, return null to avoid cookies() usage
    return null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function getCurrentUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  try {
    // 1) Prefer Authorization: Bearer <access_token>
    const authHeader = request.headers.get('authorization') || ''
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.slice(7)
      console.log('🔑 Using Authorization header for auth')
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const pub = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )
        const { data, error } = await pub.auth.getUser(token)
        if (!error && data?.user) {
          console.log('✅ Token auth successful for user:', data.user.email)
          // Load profile via service role
          if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null
          const admin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
          )
          const { data: profile } = await admin
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()
          if (!profile) return null
          return {
            id: profile.id,
            email: profile.email,
            full_name: (profile as any).full_name ?? profile.email,
            role: profile.role as any,
            is_active: (profile as any).is_active ?? true,
          }
        } else {
          console.log('❌ Token auth failed:', error)
        }
      }
    } else {
      console.log('🍪 No Authorization header, trying cookie auth')
    }

    // 2) Fallback to cookie-based session via SSR client
    console.log('🍪 Trying cookie-based authentication')

    // Create a cookie store for the SSR client
    const cookieStore: Record<string, string> = {}

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => {
            const value = request.cookies.get(name)?.value
            if (value) console.log(`  → Reading cookie ${name}`)
            return value
          },
          set: (name: string, value: string, options: any) => {
            // Store the cookie for potential response
            cookieStore[name] = value
          },
          remove: (name: string, options: any) => {
            delete cookieStore[name]
          },
        },
      }
    )

    // First try to refresh the session to ensure it's valid
    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()

    if (refreshError) {
      console.log('⚠️ Session refresh failed, trying getUser:', refreshError.message)
      // If refresh fails, try getUser as fallback
      const { data: { user }, error: getUserError } = await supabase.auth.getUser()
      if (getUserError || !user) {
        console.log('❌ Cookie auth failed:', getUserError?.message || 'No user found')
        return null
      }
      console.log('✅ Cookie auth successful (via getUser) for user:', user.email)

      // Use the user from getUser
      const userId = user.id
      const userEmail = user.email

      // Read profile
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log('❌ Missing Supabase environment variables')
        return null
      }
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
      const { data: profile, error: pErr } = await admin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (pErr || !profile) {
        console.log('❌ Profile not found for user:', userId)
        return null
      }

      console.log('✅ Successfully authenticated user:', profile.email, 'Role:', profile.role)
      return {
        id: profile.id,
        email: profile.email,
        full_name: (profile as any).full_name ?? profile.email,
        role: profile.role as any,
        is_active: (profile as any).is_active ?? true,
      }
    }

    if (!refreshedSession?.user) {
      console.log('❌ No session after refresh')
      return null
    }

    console.log('✅ Session refreshed successfully for user:', refreshedSession.user.email)
    const user = refreshedSession.user

    // Read profile via Supabase Service Role to avoid Prisma/pool issues and RLS
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('❌ Missing Supabase environment variables')
      return null
    }
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const { data: profile, error: pErr } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (pErr || !profile) {
      console.log('❌ Profile not found for user:', user.id)
      return null
    }

    console.log('✅ Successfully authenticated user:', profile.email, 'Role:', profile.role)
    return {
      id: profile.id,
      email: profile.email,
      full_name: (profile as any).full_name ?? profile.email,
      role: profile.role as any,
      is_active: (profile as any).is_active ?? true,
    }
  } catch (error) {
    console.error('❌ Error getting current user from request:', error)
    return null
  }
}
