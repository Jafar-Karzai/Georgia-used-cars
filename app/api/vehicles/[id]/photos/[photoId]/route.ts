import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserFromRequest } from '@/lib/auth/server'
import { hasPermission } from '@/lib/auth/permissions'

export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string, photoId: string }> }) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    if (!hasPermission(user.role, 'edit_vehicles') && !hasPermission(user.role, 'manage_vehicles')) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: vehicleId, photoId } = await ctx.params
    const body = await request.json().catch(() => ({}))

    if (body?.is_primary) {
      await prisma.vehiclePhoto.updateMany({ where: { vehicleId }, data: { isPrimary: false } })
      const updated = await prisma.vehiclePhoto.update({ where: { id: photoId }, data: { isPrimary: true } })
      return NextResponse.json({ success: true, data: updated })
    }

    return NextResponse.json({ success: false, error: 'No supported fields to update' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string, photoId: string }> }) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    if (!hasPermission(user.role, 'edit_vehicles') && !hasPermission(user.role, 'manage_vehicles')) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
    }

    const { photoId } = await ctx.params
    await prisma.vehiclePhoto.delete({ where: { id: photoId } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Internal error' }, { status: 500 })
  }
}
