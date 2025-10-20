'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { AuthContextType, AuthUser, Permission, ROLE_PERMISSIONS } from '@/types/auth'
import { UserRole } from '@/types/database'
import type { User } from '@supabase/supabase-js'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const ok = await fetchUserProfile(session.user)
          if (!ok) {
            // Retry once shortly after, to wait for session cookie propagation
            await new Promise(r => setTimeout(r, 300))
            await fetchUserProfile(session.user)
          }
        }
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            await fetchUserProfile(session.user)
          } else {
            setUser(null)
          }
        } catch (error) {
          console.error('Error in auth state change:', error)
        } finally {
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (authUser: User): Promise<boolean> => {
    try {
      // First, use server API that reads Prisma directly (robust to PostgREST grants)
      // Pass access token to avoid server-side cookies() access in dev
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      const res = await fetch('/api/auth/profile', {
        credentials: 'include',
        cache: 'no-store',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      })
      if (res.ok) {
        const json = await res.json()
        if (json?.success && json?.data) {
          setUser({
            id: json.data.id,
            email: json.data.email,
            full_name: json.data.full_name,
            role: json.data.role,
            is_active: json.data.is_active,
          })
          return true
        }
      }

      // No PostgREST fallback (DB grants may be restricted). Next auth event will retry.
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
    }
    // Do not downgrade to a fake Viewer; leave user as-is and let next auth event retry
    return false
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      throw error
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
    setUser(null)
    router.push('/auth/login')
  }

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false
    return ROLE_PERMISSIONS[user.role].includes(permission)
  }

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  }

  const value = {
    user,
    loading,
    signIn,
    signOut,
    hasPermission,
    hasRole
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
