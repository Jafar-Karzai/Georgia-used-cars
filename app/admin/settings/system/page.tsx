'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, Settings, Shield, Bell, Link, Server, Save, Database, AlertTriangle, Plus, X } from 'lucide-react'

interface GeneralSettings {
  system_name: string
  version: string
  environment: 'development' | 'staging' | 'production'
  maintenance_mode: boolean
  debug_mode: boolean
  log_level: 'debug' | 'info' | 'warn' | 'error'
  session_timeout: number
  max_file_upload_size: number
  allowed_file_types: string[]
  backup_frequency: 'daily' | 'weekly' | 'monthly'
  backup_retention_days: number
}

interface SecuritySettings {
  password_min_length: number
  password_require_uppercase: boolean
  password_require_lowercase: boolean
  password_require_numbers: boolean
  password_require_symbols: boolean
  max_login_attempts: number
  lockout_duration: number
  two_factor_required: boolean
  session_security: 'low' | 'medium' | 'high'
  api_rate_limit: number
  cors_origins: string[]
}

interface NotificationSettings {
  email_notifications: boolean
  sms_notifications: boolean
  push_notifications: boolean
  notification_retention_days: number
  daily_digest: boolean
  weekly_reports: boolean
  system_alerts: boolean
}

interface IntegrationSettings {
  google_analytics_id: string
  google_maps_api_key: string
  stripe_public_key: string
  stripe_webhook_secret: string
  twilio_account_sid: string
  external_apis: {
    auction_houses: boolean
    shipping_providers: boolean
    insurance_providers: boolean
  }
}

interface SystemData {
  general: GeneralSettings
  security: SecuritySettings
  notifications: NotificationSettings
  integrations: IntegrationSettings
}

const LOG_LEVELS = ['debug', 'info', 'warn', 'error']
const ENVIRONMENTS = ['development', 'staging', 'production']
const BACKUP_FREQUENCIES = ['daily', 'weekly', 'monthly']
const SESSION_SECURITY_LEVELS = ['low', 'medium', 'high']

export default function SystemSettingsPage() {
  const { user, hasPermission } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [systemData, setSystemData] = useState<SystemData | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Dialog states
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [confirmationAction, setConfirmationAction] = useState<{
    title: string
    message: string
    action: () => void
  } | null>(null)

  // Form state
  const [newCorsOrigin, setNewCorsOrigin] = useState('')
  const [newFileType, setNewFileType] = useState('')

  useEffect(() => {
    loadSystemData()
  }, [])

  const loadSystemData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/system')
      const result = await response.json()

      if (result.success) {
        setSystemData(result.data)
      } else {
        setError(result.error || 'Failed to load system settings')
      }
    } catch (err) {
      setError('Failed to load system settings')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!systemData?.general.system_name?.trim()) {
      newErrors.system_name = 'System name is required'
    }

    if (systemData?.general.session_timeout < 5) {
      newErrors.session_timeout = 'Session timeout must be at least 5 minutes'
    }

    if (systemData?.security.password_min_length < 6) {
      newErrors.password_min_length = 'Password minimum length must be at least 6'
    }

    if (systemData?.security.max_login_attempts < 1) {
      newErrors.max_login_attempts = 'Max login attempts must be at least 1'
    }

    if (systemData?.security.lockout_duration < 1) {
      newErrors.lockout_duration = 'Lockout duration must be at least 1 minute'
    }

    if (systemData?.security.api_rate_limit < 1) {
      newErrors.api_rate_limit = 'API rate limit must be at least 1'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm() || !systemData) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/settings/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemData)
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('System settings updated successfully')
        setSystemData(result.data)
      } else {
        setError(result.error || 'Failed to update system settings')
      }
    } catch (err) {
      setError('Failed to update system settings')
    } finally {
      setSaving(false)
    }
  }

  const updateGeneralField = (field: keyof GeneralSettings, value: any) => {
    if (!systemData) return
    setSystemData({
      ...systemData,
      general: { ...systemData.general, [field]: value }
    })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const updateSecurityField = (field: keyof SecuritySettings, value: any) => {
    if (!systemData) return
    setSystemData({
      ...systemData,
      security: { ...systemData.security, [field]: value }
    })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const updateNotificationField = (field: keyof NotificationSettings, value: any) => {
    if (!systemData) return
    setSystemData({
      ...systemData,
      notifications: { ...systemData.notifications, [field]: value }
    })
  }

  const updateIntegrationField = (field: keyof IntegrationSettings, value: any) => {
    if (!systemData) return
    setSystemData({
      ...systemData,
      integrations: { ...systemData.integrations, [field]: value }
    })
  }

  const handleEnvironmentChange = (value: string) => {
    if (value !== systemData?.general.environment) {
      setConfirmationAction({
        title: 'Environment Change Warning',
        message: 'Changing the environment may affect system behavior. Are you sure you want to proceed?',
        action: () => updateGeneralField('environment', value)
      })
      setConfirmationDialogOpen(true)
    }
  }

  const handleDebugModeToggle = (checked: boolean) => {
    if (checked) {
      setConfirmationAction({
        title: 'Enable Debug Mode?',
        message: 'Debug mode should only be enabled for troubleshooting. It may expose sensitive information.',
        action: () => updateGeneralField('debug_mode', true)
      })
      setConfirmationDialogOpen(true)
    } else {
      updateGeneralField('debug_mode', false)
    }
  }

  const addCorsOrigin = () => {
    if (newCorsOrigin.trim() && systemData) {
      const updatedOrigins = [...systemData.security.cors_origins, newCorsOrigin.trim()]
      updateSecurityField('cors_origins', updatedOrigins)
      setNewCorsOrigin('')
    }
  }

  const removeCorsOrigin = (index: number) => {
    if (systemData) {
      const updatedOrigins = systemData.security.cors_origins.filter((_, i) => i !== index)
      updateSecurityField('cors_origins', updatedOrigins)
    }
  }

  const addFileType = () => {
    if (newFileType.trim() && systemData) {
      const updatedTypes = [...systemData.general.allowed_file_types, newFileType.trim().toLowerCase()]
      updateGeneralField('allowed_file_types', updatedTypes)
      setNewFileType('')
    }
  }

  const removeFileType = (index: number) => {
    if (systemData) {
      const updatedTypes = systemData.general.allowed_file_types.filter((_, i) => i !== index)
      updateGeneralField('allowed_file_types', updatedTypes)
    }
  }

  const handleManualBackup = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/settings/system/backup', {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('Backup initiated successfully')
      } else {
        setError(result.error || 'Failed to initiate backup')
      }
    } catch (err) {
      setError('Failed to initiate backup')
    } finally {
      setSaving(false)
    }
  }

  if (!user || !hasPermission('manage_settings') || user.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to manage system settings</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (error && !systemData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">Error Loading Settings</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={loadSystemData} className="mt-4">Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">
          Configure system-wide settings and preferences
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>
              Basic system configuration and environment settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="system_name">System Name *</Label>
                <Input
                  id="system_name"
                  value={systemData?.general.system_name || ''}
                  onChange={(e) => updateGeneralField('system_name', e.target.value)}
                  placeholder="Enter system name"
                />
                {errors.system_name && (
                  <p className="text-sm text-destructive">{errors.system_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={systemData?.general.version || ''}
                  onChange={(e) => updateGeneralField('version', e.target.value)}
                  placeholder="Enter version"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="environment">Environment</Label>
                <Select
                  value={systemData?.general.environment}
                  onValueChange={handleEnvironmentChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENVIRONMENTS.map((env) => (
                      <SelectItem key={env} value={env}>
                        {env.charAt(0).toUpperCase() + env.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="log_level">Log Level</Label>
                <Select
                  value={systemData?.general.log_level}
                  onValueChange={(value) => updateGeneralField('log_level', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select log level" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOG_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                <Input
                  id="session_timeout"
                  type="number"
                  min="5"
                  value={systemData?.general.session_timeout || 30}
                  onChange={(e) => updateGeneralField('session_timeout', parseInt(e.target.value) || 30)}
                />
                {errors.session_timeout && (
                  <p className="text-sm text-destructive">{errors.session_timeout}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_file_upload_size">Max File Upload Size (MB)</Label>
                <Input
                  id="max_file_upload_size"
                  type="number"
                  min="1"
                  value={systemData?.general.max_file_upload_size || 10}
                  onChange={(e) => updateGeneralField('max_file_upload_size', parseInt(e.target.value) || 10)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="maintenance_mode"
                  checked={systemData?.general.maintenance_mode || false}
                  onCheckedChange={(checked) => updateGeneralField('maintenance_mode', checked)}
                />
                <Label htmlFor="maintenance_mode">Maintenance Mode</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="debug_mode"
                  checked={systemData?.general.debug_mode || false}
                  onCheckedChange={handleDebugModeToggle}
                />
                <Label htmlFor="debug_mode">Debug Mode</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Allowed File Types</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {systemData?.general.allowed_file_types?.map((type, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {type}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => removeFileType(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newFileType}
                  onChange={(e) => setNewFileType(e.target.value)}
                  placeholder="Add file type (e.g., pdf)"
                />
                <Button type="button" onClick={addFileType}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Password policies and access control settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password_min_length">Password Minimum Length</Label>
                <Input
                  id="password_min_length"
                  type="number"
                  min="6"
                  value={systemData?.security.password_min_length || 8}
                  onChange={(e) => updateSecurityField('password_min_length', parseInt(e.target.value) || 8)}
                />
                {errors.password_min_length && (
                  <p className="text-sm text-destructive">{errors.password_min_length}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_login_attempts">Max Login Attempts</Label>
                <Input
                  id="max_login_attempts"
                  type="number"
                  min="1"
                  value={systemData?.security.max_login_attempts || 5}
                  onChange={(e) => updateSecurityField('max_login_attempts', parseInt(e.target.value) || 5)}
                />
                {errors.max_login_attempts && (
                  <p className="text-sm text-destructive">{errors.max_login_attempts}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lockout_duration">Lockout Duration (minutes)</Label>
                <Input
                  id="lockout_duration"
                  type="number"
                  min="1"
                  value={systemData?.security.lockout_duration || 30}
                  onChange={(e) => updateSecurityField('lockout_duration', parseInt(e.target.value) || 30)}
                />
                {errors.lockout_duration && (
                  <p className="text-sm text-destructive">{errors.lockout_duration}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_rate_limit">API Rate Limit (requests/hour)</Label>
                <Input
                  id="api_rate_limit"
                  type="number"
                  min="1"
                  value={systemData?.security.api_rate_limit || 1000}
                  onChange={(e) => updateSecurityField('api_rate_limit', parseInt(e.target.value) || 1000)}
                />
                {errors.api_rate_limit && (
                  <p className="text-sm text-destructive">{errors.api_rate_limit}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="session_security">Session Security Level</Label>
                <Select
                  value={systemData?.security.session_security}
                  onValueChange={(value) => updateSecurityField('session_security', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select security level" />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_SECURITY_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Password Requirements</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="require_uppercase"
                    checked={systemData?.security.password_require_uppercase || false}
                    onCheckedChange={(checked) => updateSecurityField('password_require_uppercase', checked)}
                  />
                  <Label htmlFor="require_uppercase">Require Uppercase</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="require_lowercase"
                    checked={systemData?.security.password_require_lowercase || false}
                    onCheckedChange={(checked) => updateSecurityField('password_require_lowercase', checked)}
                  />
                  <Label htmlFor="require_lowercase">Require Lowercase</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="require_numbers"
                    checked={systemData?.security.password_require_numbers || false}
                    onCheckedChange={(checked) => updateSecurityField('password_require_numbers', checked)}
                  />
                  <Label htmlFor="require_numbers">Require Numbers</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="require_symbols"
                    checked={systemData?.security.password_require_symbols || false}
                    onCheckedChange={(checked) => updateSecurityField('password_require_symbols', checked)}
                  />
                  <Label htmlFor="require_symbols">Require Symbols</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>CORS Origins</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {systemData?.security.cors_origins?.map((origin, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {origin}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => removeCorsOrigin(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newCorsOrigin}
                  onChange={(e) => setNewCorsOrigin(e.target.value)}
                  placeholder="Enter CORS origin (e.g., https://example.com)"
                />
                <Button type="button" onClick={addCorsOrigin}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backup Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Backup Settings
            </CardTitle>
            <CardDescription>
              Configure automatic backups and retention policies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="backup_frequency">Backup Frequency</Label>
                <Select
                  value={systemData?.general.backup_frequency}
                  onValueChange={(value) => updateGeneralField('backup_frequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {BACKUP_FREQUENCIES.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup_retention_days">Retention Period (days)</Label>
                <Input
                  id="backup_retention_days"
                  type="number"
                  min="1"
                  value={systemData?.general.backup_retention_days || 30}
                  onChange={(e) => updateGeneralField('backup_retention_days', parseInt(e.target.value) || 30)}
                />
              </div>
            </div>

            <div className="flex justify-start">
              <Button
                type="button"
                variant="outline"
                onClick={handleManualBackup}
                disabled={saving}
              >
                <Database className="h-4 w-4 mr-2" />
                Create Backup Now
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      {/* Confirmation Dialog */}
      <Dialog open={confirmationDialogOpen} onOpenChange={setConfirmationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {confirmationAction?.title}
            </DialogTitle>
            <DialogDescription>
              {confirmationAction?.message}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmationDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                confirmationAction?.action()
                setConfirmationDialogOpen(false)
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}