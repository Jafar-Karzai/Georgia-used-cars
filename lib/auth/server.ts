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
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const pub = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )
        const { data, error } = await pub.auth.getUser(token)
        if (!error && data?.user) {
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
        }
      }
    }

    // 2) Fallback to cookie-based session via SSR client
    // Use SSR client with request.cookies access only (no global cookies())
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => request.cookies.get(name)?.value,
          set: () => { /* no-op in route GET */ },
          remove: () => { /* no-op in route GET */ },
        },
      }
    )

    const { data: { session }, error } = await supabase.auth.getSession()
    if (error || !session?.user) {
      return null
    }

    // Read profile via Supabase Service Role to avoid Prisma/pool issues and RLS
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return null
    }
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const { data: profile, error: pErr } = await admin
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    if (pErr || !profile) return null

    return {
      id: profile.id,
      email: profile.email,
      full_name: (profile as any).full_name ?? profile.email,
      role: profile.role as any,
      is_active: (profile as any).is_active ?? true,
    }
  } catch (error) {
    console.error('Error getting current user from request:', error)
    return null
  }
}
