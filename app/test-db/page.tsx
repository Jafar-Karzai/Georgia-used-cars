'use client'

import { useState, useEffect } from 'react'
import { testDatabaseConnection, getAllTables } from '@/lib/database/test-connection'
import { Button } from '@/components/ui/button'

export default function TestDbPage() {
  const [connectionResult, setConnectionResult] = useState<any>(null)
  const [tablesResult, setTablesResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    
    try {
      // Test connection
      const connResult = await testDatabaseConnection()
      setConnectionResult(connResult)
      
      // Test all tables
      const tablesRes = await getAllTables()
      setTablesResult(tablesRes)
    } catch (error) {
      console.error('Test failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Database Connection Test</h1>
      
      <div className="space-y-6">
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          {loading ? (
            <p>Testing connection...</p>
          ) : connectionResult ? (
            <div>
              {connectionResult.success ? (
                <div className="text-green-600">
                  ✅ Database connection successful!
                </div>
              ) : (
                <div className="text-red-600">
                  ❌ Connection failed: {connectionResult.error}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Table Status</h2>
          {tablesResult ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(tablesResult).map(([tableName, exists]) => (
                <div key={tableName} className="flex items-center gap-2">
                  <span className={exists ? 'text-green-600' : 'text-red-600'}>
                    {exists ? '✅' : '❌'}
                  </span>
                  <span className="text-sm">{tableName}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>Testing tables...</p>
          )}
        </div>

        <Button onClick={runTests} disabled={loading}>
          {loading ? 'Testing...' : 'Run Tests Again'}
        </Button>
      </div>
    </div>
  )
}