import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUserFromRequest } from '@/lib/auth/server'
import { hasPermission } from '@/lib/auth/permissions'

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    if (!hasPermission(user.role, 'edit_vehicles') && !hasPermission(user.role, 'manage_vehicles')) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: vehicleId } = await ctx.params
    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })

    const { url, is_primary, sort_order } = body as { url: string; is_primary?: boolean; sort_order?: number }
    if (!url) return NextResponse.json({ success: false, error: 'url is required' }, { status: 400 })

    try {
      const photo = await prisma.vehiclePhoto.create({
        data: {
          vehicleId,
          url,
          isPrimary: Boolean(is_primary),
          sortOrder: typeof sort_order === 'number' ? sort_order : 0,
          uploadedBy: user.id,
        },
      })
      if (is_primary) {
        await prisma.vehiclePhoto.updateMany({
          where: { vehicleId, NOT: { id: photo.id } },
          data: { isPrimary: false },
        })
      }
      // Issue 11: Serialize photo response to snake_case for API consistency
      const serializedPhoto = {
        id: photo.id,
        vehicle_id: photo.vehicleId,
        url: photo.url,
        is_primary: photo.isPrimary,
        sort_order: photo.sortOrder,
        uploaded_by: photo.uploadedBy,
        uploaded_at: photo.uploadedAt,
      }
      return NextResponse.json({ success: true, data: serializedPhoto })
    } catch (e: any) {
      // Fallback via Supabase Service Role to avoid Prisma/pool issues
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Photo upload fallback skipped: Missing Supabase config. Original error:', e.message)
        return NextResponse.json({ success: false, error: e.message || 'Internal error' }, { status: 500 })
      }

      // Issue 12: Add logging for fallback mechanism
      console.warn('Photo upload failed with Prisma, falling back to Supabase. Error:', e.message)

      const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
      const { data, error } = await admin
        .from('vehicle_photos')
        .insert({
          vehicle_id: vehicleId,
          url,
          is_primary: Boolean(is_primary),
          sort_order: typeof sort_order === 'number' ? sort_order : 0,
          uploaded_by: user.id,
        })
        .select('*')
        .single()
      if (error) {
        console.error('Supabase fallback error:', error.message)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      if (is_primary) {
        await admin
          .from('vehicle_photos')
          .update({ is_primary: false })
          .eq('vehicle_id', vehicleId)
          .neq('id', data.id)
      }

      console.info('Photo upload succeeded via Supabase fallback')
      return NextResponse.json({ success: true, data })
    }
  } catch (e: any) {
    console.error('Unexpected error in photo upload endpoint:', e)
    return NextResponse.json({ success: false, error: e.message || 'Internal error' }, { status: 500 })
  }
}
