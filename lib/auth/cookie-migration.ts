/**
 * Cookie cleanup utility for clearing corrupted Supabase auth cookies
 * Only called when Supabase explicitly reports a parse error
 */

export function clearLegacySupabaseCookies() {
  if (typeof window === 'undefined') return

  try {
    // Get all cookies
    const cookies = document.cookie.split(';')

    // Find all Supabase-related cookies
    const supabaseCookies = cookies
      .map(cookie => cookie.trim())
      .filter(cookie => {
        const name = cookie.split('=')[0]
        return (
          name.startsWith('sb-') ||
          name.includes('supabase') ||
          name.includes('auth-token')
        )
      })

    // Delete each Supabase cookie
    supabaseCookies.forEach(cookie => {
      const name = cookie.split('=')[0]
      // Delete for all possible paths and domains
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`
    })

    // Clear localStorage items
    const localStorageKeys = Object.keys(localStorage)
    localStorageKeys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key)
      }
    })

    // Clear sessionStorage items
    const sessionStorageKeys = Object.keys(sessionStorage)
    sessionStorageKeys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
        sessionStorage.removeItem(key)
      }
    })

    console.log('✅ Corrupted Supabase cookies and storage cleared')
    return true
  } catch (error) {
    console.error('Error clearing cookies:', error)
    return false
  }
}
