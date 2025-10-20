import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Prefer Authorization: Bearer <access_token> from client to avoid Next cookies() pitfalls in dev
    const authHeader = request.headers.get('authorization') || ''
    let userId: string | null = null

    if (authHeader.toLowerCase().startsWith('bearer ')) {
      const accessToken = authHeader.slice(7)
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
        const { data, error } = await supabase.auth.getUser(accessToken)
        if (!error && data?.user) {
          userId = data.user.id
        }
      }
    }

    // If no Authorization header, we cannot validate user; treat as unauthenticated
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    // Use Supabase Service Role to fetch profile reliably (bypasses RLS and Prisma/pool issues)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ success: false, error: 'Server missing Supabase service role configuration' }, { status: 500 })
    }
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (profileErr) {
      return NextResponse.json({ success: false, error: profileErr.message }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: profile.id,
        email: profile.email,
        full_name: (profile as any).fullName ?? profile.full_name ?? profile.email,
        role: profile.role,
        is_active: (profile as any).isActive ?? profile.is_active ?? true,
      }
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Internal error' }, { status: 500 })
  }
}
