import { supabase } from '@/lib/supabase/client'

export async function testDatabaseConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (error) {
      console.error('Database connection error:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Database connection successful!')
    return { success: true, data }
  } catch (err) {
    console.error('Connection test failed:', err)
    return { success: false, error: 'Connection failed' }
  }
}

export async function testTableExists(tableName: string) {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)

    return !error
  } catch {
    return false
  }
}

export async function getAllTables() {
  const tables = [
    'profiles',
    'vehicles', 
    'vehicle_status_history',
    'vehicle_photos',
    'vehicle_documents',
    'expenses',
    'customers',
    'inquiries',
    'communications',
    'invoices',
    'invoice_items',
    'payments',
    'exchange_rates',
    'settings',
    'audit_log'
  ]

  const results: Record<string, boolean> = {}
  
  for (const table of tables) {
    results[table] = await testTableExists(table)
  }

  return results
}