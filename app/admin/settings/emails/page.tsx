'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Mail, Plus, Edit, Trash2, Send, Eye, TestTube, Settings, Save } from 'lucide-react'

interface EmailTemplate {
  id: string
  name: string
  type: string
  subject: string
  content: string
  variables: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

interface SMTPSettings {
  smtp_host: string
  smtp_port: number
  smtp_username: string
  smtp_password: string
  from_name: string
  from_email: string
  reply_to: string
  use_tls: boolean
}

interface EmailData {
  templates: EmailTemplate[]
  settings: SMTPSettings
}

const TEMPLATE_TYPES = [
  { value: 'invoice_notification', label: 'Invoice Notification' },
  { value: 'payment_confirmation', label: 'Payment Confirmation' },
  { value: 'customer_welcome', label: 'Customer Welcome' },
  { value: 'inquiry_response', label: 'Inquiry Response' },
  { value: 'vehicle_notification', label: 'Vehicle Notification' },
  { value: 'system_notification', label: 'System Notification' }
]

export default function EmailTemplatesPage() {
  const { user, hasPermission } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [emailData, setEmailData] = useState<EmailData | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Dialog states
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)
  const [testTemplate, setTestTemplate] = useState<EmailTemplate | null>(null)
  const [deletingTemplate, setDeletingTemplate] = useState<EmailTemplate | null>(null)
  const [testEmail, setTestEmail] = useState('')

  useEffect(() => {
    loadEmailData()
  }, [])

  const loadEmailData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/emails')
      const result = await response.json()

      if (result.success) {
        setEmailData(result.data)
      } else {
        setError(result.error || 'Failed to load email templates')
      }
    } catch (err) {
      setError('Failed to load email templates')
    } finally {
      setLoading(false)
    }
  }

  const validateSMTPSettings = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!emailData?.settings.smtp_host?.trim()) {
      newErrors.smtp_host = 'SMTP host is required'
    }

    if (!emailData?.settings.smtp_port || emailData.settings.smtp_port < 1) {
      newErrors.smtp_port = 'Valid SMTP port is required'
    }

    if (!emailData?.settings.from_email?.trim()) {
      newErrors.from_email = 'From email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailData.settings.from_email)) {
      newErrors.from_email = 'Please enter a valid email address'
    }

    if (!emailData?.settings.from_name?.trim()) {
      newErrors.from_name = 'From name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSMTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateSMTPSettings() || !emailData) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/settings/emails/smtp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData.settings)
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('SMTP settings updated successfully')
      } else {
        setError(result.error || 'Failed to update SMTP settings')
      }
    } catch (err) {
      setError('Failed to update SMTP settings')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/settings/emails/test-connection', {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('SMTP connection successful')
      } else {
        setError(result.error || 'SMTP connection failed')
      }
    } catch (err) {
      setError('Failed to test SMTP connection')
    } finally {
      setSaving(false)
    }
  }

  const handleAddTemplate = () => {
    setEditingTemplate({
      id: '',
      name: '',
      type: '',
      subject: '',
      content: '',
      variables: [],
      is_active: true,
      created_at: '',
      updated_at: ''
    })
    setTemplateDialogOpen(true)
  }

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template)
    setTemplateDialogOpen(true)
  }

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setPreviewTemplate(template)
    setPreviewDialogOpen(true)
  }

  const handleTestTemplate = (template: EmailTemplate) => {
    setTestTemplate(template)
    setTestEmail('')
    setTestDialogOpen(true)
  }

  const handleDeleteTemplate = (template: EmailTemplate) => {
    setDeletingTemplate(template)
    setDeleteDialogOpen(true)
  }

  const handleToggleTemplate = async (template: EmailTemplate) => {
    try {
      const response = await fetch(`/api/settings/emails/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !template.is_active })
      })

      const result = await response.json()

      if (result.success) {
        await loadEmailData()
        setSuccess(`Template ${template.is_active ? 'deactivated' : 'activated'} successfully`)
      } else {
        setError(result.error || 'Failed to update template')
      }
    } catch (err) {
      setError('Failed to update template')
    }
  }

  const confirmDelete = async () => {
    if (!deletingTemplate) return

    try {
      const response = await fetch(`/api/settings/emails/${deletingTemplate.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        await loadEmailData()
        setSuccess('Template deleted successfully')
      } else {
        setError(result.error || 'Failed to delete template')
      }
    } catch (err) {
      setError('Failed to delete template')
    }

    setDeleteDialogOpen(false)
    setDeletingTemplate(null)
  }

  const sendTestEmail = async () => {
    if (!testTemplate || !testEmail) return

    try {
      setSaving(true)
      const response = await fetch('/api/settings/emails/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: testTemplate.id,
          test_email: testEmail
        })
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('Test email sent successfully')
        setTestDialogOpen(false)
      } else {
        setError(result.error || 'Failed to send test email')
      }
    } catch (err) {
      setError('Failed to send test email')
    } finally {
      setSaving(false)
    }
  }

  const updateSMTPField = (field: keyof SMTPSettings, value: any) => {
    if (!emailData) return
    setEmailData({
      ...emailData,
      settings: { ...emailData.settings, [field]: value }
    })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  if (!user || !hasPermission('manage_settings')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to manage email templates</p>
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

  if (error && !emailData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">Error Loading Settings</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={loadEmailData} className="mt-4">Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Email Templates</h1>
        <p className="text-muted-foreground">
          Manage email templates and SMTP settings
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

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="smtp">SMTP Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Templates
              </CardTitle>
              <CardDescription>
                Manage email templates for automated notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Available Templates</h3>
                <Button onClick={handleAddTemplate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Template
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailData?.templates?.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{template.type}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{template.subject}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={template.is_active}
                            onCheckedChange={() => handleToggleTemplate(template)}
                            aria-label={`Toggle ${template.name}`}
                          />
                          <Badge variant={template.is_active ? 'default' : 'secondary'}>
                            {template.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreviewTemplate(template)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestTemplate(template)}
                          >
                            <TestTube className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smtp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                SMTP Settings
              </CardTitle>
              <CardDescription>
                Configure email server settings for sending notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSMTPSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp_host">SMTP Host *</Label>
                    <Input
                      id="smtp_host"
                      value={emailData?.settings.smtp_host || ''}
                      onChange={(e) => updateSMTPField('smtp_host', e.target.value)}
                      placeholder="smtp.example.com"
                    />
                    {errors.smtp_host && (
                      <p className="text-sm text-destructive">{errors.smtp_host}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp_port">SMTP Port *</Label>
                    <Input
                      id="smtp_port"
                      type="number"
                      value={emailData?.settings.smtp_port || 587}
                      onChange={(e) => updateSMTPField('smtp_port', parseInt(e.target.value) || 587)}
                      placeholder="587"
                    />
                    {errors.smtp_port && (
                      <p className="text-sm text-destructive">{errors.smtp_port}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp_username">SMTP Username</Label>
                    <Input
                      id="smtp_username"
                      value={emailData?.settings.smtp_username || ''}
                      onChange={(e) => updateSMTPField('smtp_username', e.target.value)}
                      placeholder="Enter SMTP username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp_password">SMTP Password</Label>
                    <Input
                      id="smtp_password"
                      type="password"
                      value={emailData?.settings.smtp_password || ''}
                      onChange={(e) => updateSMTPField('smtp_password', e.target.value)}
                      placeholder="Enter SMTP password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="from_name">From Name *</Label>
                    <Input
                      id="from_name"
                      value={emailData?.settings.from_name || ''}
                      onChange={(e) => updateSMTPField('from_name', e.target.value)}
                      placeholder="Georgia Used Cars"
                    />
                    {errors.from_name && (
                      <p className="text-sm text-destructive">{errors.from_name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="from_email">From Email *</Label>
                    <Input
                      id="from_email"
                      type="email"
                      value={emailData?.settings.from_email || ''}
                      onChange={(e) => updateSMTPField('from_email', e.target.value)}
                      placeholder="noreply@georgiaused.com"
                    />
                    {errors.from_email && (
                      <p className="text-sm text-destructive">{errors.from_email}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="reply_to">Reply-To Email</Label>
                    <Input
                      id="reply_to"
                      type="email"
                      value={emailData?.settings.reply_to || ''}
                      onChange={(e) => updateSMTPField('reply_to', e.target.value)}
                      placeholder="support@georgiaused.com"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="use_tls"
                    checked={emailData?.settings.use_tls || false}
                    onCheckedChange={(checked) => updateSMTPField('use_tls', checked)}
                  />
                  <Label htmlFor="use_tls">Use TLS Encryption</Label>
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={saving}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Connection
                  </Button>

                  <Button type="submit" disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save SMTP Settings'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Template Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview of "{previewTemplate?.name}" template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Subject:</Label>
              <p className="text-sm bg-muted p-2 rounded">{previewTemplate?.subject}</p>
            </div>
            
            <div>
              <Label>Content:</Label>
              <div className="text-sm bg-muted p-4 rounded whitespace-pre-wrap">
                {previewTemplate?.content}
              </div>
            </div>

            <div>
              <Label>Available Variables:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {previewTemplate?.variables.map((variable) => (
                  <Badge key={variable} variant="outline">
                    {variable}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Test Email Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email using the "{testTemplate?.name}" template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test_email">Test Email Address</Label>
              <Input
                id="test_email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendTestEmail} disabled={saving || !testEmail}>
              <Send className="h-4 w-4 mr-2" />
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the email template "{deletingTemplate?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}