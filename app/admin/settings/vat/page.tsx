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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Calculator, Plus, Edit, Trash2, Save } from 'lucide-react'

interface VATRate {
  id: string
  name: string
  rate: number
  description: string
  is_default: boolean
  effective_date: string
}

interface VATExemption {
  id: string
  category: string
  description: string
  applies_to: 'goods' | 'services' | 'both'
}

interface VATData {
  id: string
  default_vat_rate: number
  vat_registration_number: string
  vat_enabled: boolean
  rates: VATRate[]
  exemptions: VATExemption[]
}

export default function VATSettingsPage() {
  const { user, hasPermission } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState<VATData | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Dialog states
  const [rateDialogOpen, setRateDialogOpen] = useState(false)
  const [exemptionDialogOpen, setExemptionDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<VATRate | null>(null)
  const [editingExemption, setEditingExemption] = useState<VATExemption | null>(null)
  const [deletingItem, setDeletingItem] = useState<{ type: 'rate' | 'exemption'; id: string } | null>(null)

  useEffect(() => {
    loadVATData()
  }, [])

  const loadVATData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/vat')
      const result = await response.json()

      if (result.success) {
        setFormData(result.data)
      } else {
        setError(result.error || 'Failed to load VAT settings')
      }
    } catch (err) {
      setError('Failed to load VAT settings')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (formData?.vat_enabled) {
      if (!formData?.vat_registration_number?.trim()) {
        newErrors.vat_registration_number = 'VAT registration number is required when VAT is enabled'
      } else if (formData.vat_registration_number.length < 9) {
        newErrors.vat_registration_number = 'VAT registration number must be at least 9 characters'
      }

      if (formData?.default_vat_rate < 0 || formData?.default_vat_rate > 100) {
        newErrors.default_vat_rate = 'VAT rate must be between 0 and 100'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm() || !formData) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/settings/vat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('VAT settings updated successfully')
        setFormData(result.data)
      } else {
        setError(result.error || 'Failed to update VAT settings')
      }
    } catch (err) {
      setError('Failed to update VAT settings')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof VATData, value: any) => {
    if (!formData) return
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const handleAddRate = () => {
    setEditingRate({
      id: '',
      name: '',
      rate: 0,
      description: '',
      is_default: false,
      effective_date: new Date().toISOString().split('T')[0]
    })
    setRateDialogOpen(true)
  }

  const handleEditRate = (rate: VATRate) => {
    setEditingRate(rate)
    setRateDialogOpen(true)
  }

  const handleDeleteRate = (rateId: string) => {
    setDeletingItem({ type: 'rate', id: rateId })
    setDeleteDialogOpen(true)
  }

  const handleAddExemption = () => {
    setEditingExemption({
      id: '',
      category: '',
      description: '',
      applies_to: 'both'
    })
    setExemptionDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingItem) return

    try {
      const endpoint = deletingItem.type === 'rate' 
        ? `/api/settings/vat/rates/${deletingItem.id}`
        : `/api/settings/vat/exemptions/${deletingItem.id}`

      const response = await fetch(endpoint, { method: 'DELETE' })
      const result = await response.json()

      if (result.success) {
        await loadVATData()
        setSuccess(`${deletingItem.type === 'rate' ? 'Rate' : 'Exemption'} deleted successfully`)
      } else {
        setError(result.error || 'Failed to delete item')
      }
    } catch (err) {
      setError('Failed to delete item')
    }

    setDeleteDialogOpen(false)
    setDeletingItem(null)
  }

  if (!user || !hasPermission('manage_settings')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to manage VAT settings</p>
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

  if (error && !formData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">Error Loading Settings</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={loadVATData} className="mt-4">Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">VAT Settings</h1>
        <p className="text-muted-foreground">
          Configure VAT rates and tax settings for your business
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
        {/* General VAT Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              General VAT Settings
            </CardTitle>
            <CardDescription>
              Basic VAT configuration and registration details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="vat_enabled"
                checked={formData?.vat_enabled || false}
                onCheckedChange={(checked) => updateField('vat_enabled', checked)}
              />
              <Label htmlFor="vat_enabled">Enable VAT</Label>
            </div>

            {formData?.vat_enabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vat_registration_number">VAT Registration Number *</Label>
                    <Input
                      id="vat_registration_number"
                      value={formData?.vat_registration_number || ''}
                      onChange={(e) => updateField('vat_registration_number', e.target.value)}
                      placeholder="Enter VAT registration number"
                    />
                    {errors.vat_registration_number && (
                      <p className="text-sm text-destructive">{errors.vat_registration_number}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="default_vat_rate">Default VAT Rate (%)</Label>
                    <Input
                      id="default_vat_rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData?.default_vat_rate || 0}
                      onChange={(e) => updateField('default_vat_rate', parseFloat(e.target.value) || 0)}
                      placeholder="Enter default VAT rate"
                    />
                    {errors.default_vat_rate && (
                      <p className="text-sm text-destructive">{errors.default_vat_rate}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* VAT Rates */}
        {formData?.vat_enabled && (
          <Card>
            <CardHeader>
              <CardTitle>VAT Rates</CardTitle>
              <CardDescription>
                Manage different VAT rates for various goods and services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Current Rates</h3>
                <Button onClick={handleAddRate} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add VAT Rate
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData?.rates?.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell className="font-medium">{rate.name}</TableCell>
                      <TableCell>{rate.rate}%</TableCell>
                      <TableCell>{rate.description}</TableCell>
                      <TableCell>
                        {rate.is_default && (
                          <Badge variant="default">Default</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRate(rate)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {!rate.is_default && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteRate(rate.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* VAT Exemptions */}
        {formData?.vat_enabled && (
          <Card>
            <CardHeader>
              <CardTitle>VAT Exemptions</CardTitle>
              <CardDescription>
                Configure categories that are exempt from VAT
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Current Exemptions</h3>
                <Button onClick={handleAddExemption} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exemption
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Applies To</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData?.exemptions?.map((exemption) => (
                    <TableRow key={exemption.id}>
                      <TableCell className="font-medium">{exemption.category}</TableCell>
                      <TableCell>{exemption.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {exemption.applies_to}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingItem({ type: 'exemption', id: exemption.id })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      {/* Add/Edit Rate Dialog */}
      <Dialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRate?.id ? 'Edit VAT Rate' : 'Add VAT Rate'}
            </DialogTitle>
            <DialogDescription>
              Configure VAT rate details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rate_name">Rate Name *</Label>
              <Input
                id="rate_name"
                value={editingRate?.name || ''}
                onChange={(e) => setEditingRate(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Enter rate name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate_percentage">Rate Percentage *</Label>
              <Input
                id="rate_percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={editingRate?.rate || 0}
                onChange={(e) => setEditingRate(prev => prev ? { ...prev, rate: parseFloat(e.target.value) || 0 } : null)}
                placeholder="Enter rate percentage"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate_description">Description</Label>
              <Textarea
                id="rate_description"
                value={editingRate?.description || ''}
                onChange={(e) => setEditingRate(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="Enter rate description"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Handle save rate logic here
              setRateDialogOpen(false)
            }}>
              Save Rate
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
              Are you sure you want to delete this {deletingItem?.type}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete {deletingItem?.type === 'rate' ? 'Rate' : 'Exemption'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}