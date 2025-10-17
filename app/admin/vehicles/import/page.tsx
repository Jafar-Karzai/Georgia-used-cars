'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  Download, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Car,
  Database,
  Plus,
  ExternalLink,
  History
} from 'lucide-react'
import { VehicleService, CreateVehicleData } from '@/lib/services/vehicles'

interface CsvRow {
  vin: string
  year: string
  make: string
  model: string
  trim?: string
  engine?: string
  mileage?: string
  exterior_color?: string
  interior_color?: string
  transmission?: string
  fuel_type?: string
  body_style?: string
  auction_house: string
  auction_location?: string
  sale_date?: string
  lot_number?: string
  primary_damage?: string
  secondary_damage?: string
  damage_description?: string
  damage_severity?: string
  repair_estimate?: string
  title_status?: string
  keys_available?: string
  run_and_drive?: string
  purchase_price: string
  purchase_currency?: string
  estimated_total_cost?: string
}

interface ValidationError {
  row: number
  field: string
  message: string
}

interface ImportResult {
  total: number
  successful: number
  failed: number
  errors: Array<{ row: number; error: string }>
}

interface ParsedVehicle extends CreateVehicleData {
  originalRow: number
}

export default function VehicleImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<ParsedVehicle[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [duplicateVins, setDuplicateVins] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Manual entry form state
  const [manualForm, setManualForm] = useState<Partial<CreateVehicleData>>({})
  const [manualErrors, setManualErrors] = useState<Record<string, string>>({})

  // Auction API form state
  const [auctionConfig, setAuctionConfig] = useState({
    house: '',
    apiKey: '',
    searchCriteria: ''
  })

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFileError(null)
    setValidationErrors([])
    setDuplicateVins([])
    setCsvData([])
    setImportResult(null)

    // Validate file type
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setFileError('Only CSV files are supported')
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File size exceeds maximum limit of 10MB')
      return
    }

    setSelectedFile(file)

    try {
      const content = await file.text()
      await parseAndValidateCsv(content)
    } catch (error) {
      setFileError('Error reading file')
      setSelectedFile(null)
    }
  }

  const parseAndValidateCsv = async (content: string) => {
    const lines = content.trim().split('\n').filter(line => line.trim() !== '')
    if (lines.length < 2) {
      setFileError('CSV file must contain headers and at least one data row')
      return
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const requiredFields = ['vin', 'year', 'make', 'model', 'auction_house', 'purchase_price']
    
    // Check for required headers
    const missingHeaders = requiredFields.filter(field => !headers.includes(field))
    if (missingHeaders.length > 0) {
      setFileError(`Missing required columns: ${missingHeaders.join(', ')}`)
      return
    }

    const parsedData: ParsedVehicle[] = []
    const errors: ValidationError[] = []
    const vinSet = new Set<string>()
    const duplicates = new Set<string>()

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const row: Record<string, string> = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })

      // Validate required fields
      const vehicleData: Partial<CreateVehicleData> = {
        originalRow: i + 1
      } as ParsedVehicle

      // VIN validation
      if (!row.vin) {
        errors.push({ row: i + 1, field: 'vin', message: 'VIN is required' })
      } else if (row.vin.length < 10 || row.vin.length > 17) {
        errors.push({ row: i + 1, field: 'vin', message: 'Invalid VIN format' })
      } else {
        if (vinSet.has(row.vin)) {
          duplicates.add(row.vin)
        }
        vinSet.add(row.vin)
        vehicleData.vin = row.vin
      }

      // Year validation
      if (!row.year) {
        errors.push({ row: i + 1, field: 'year', message: 'Year is required' })
      } else {
        const year = parseInt(row.year)
        if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
          errors.push({ row: i + 1, field: 'year', message: 'Year must be a number between 1900 and current year' })
        } else {
          vehicleData.year = year
        }
      }

      // Make validation
      if (!row.make) {
        errors.push({ row: i + 1, field: 'make', message: 'Make is required' })
      } else {
        vehicleData.make = row.make
      }

      // Model validation
      if (!row.model) {
        errors.push({ row: i + 1, field: 'model', message: 'Model is required' })
      } else {
        vehicleData.model = row.model
      }

      // Auction house validation
      if (!row.auction_house) {
        errors.push({ row: i + 1, field: 'auction_house', message: 'Auction house is required' })
      } else {
        vehicleData.auction_house = row.auction_house
      }

      // Purchase price validation
      if (!row.purchase_price) {
        errors.push({ row: i + 1, field: 'purchase_price', message: 'Purchase price is required' })
      } else {
        const price = parseFloat(row.purchase_price)
        if (isNaN(price) || price <= 0) {
          errors.push({ row: i + 1, field: 'purchase_price', message: 'Purchase price must be a positive number' })
        } else {
          vehicleData.purchase_price = price
        }
      }

      // Optional fields
      if (row.trim) vehicleData.trim = row.trim
      if (row.engine) vehicleData.engine = row.engine
      if (row.mileage) {
        const mileage = parseInt(row.mileage)
        if (!isNaN(mileage)) vehicleData.mileage = mileage
      }
      if (row.exterior_color) vehicleData.exterior_color = row.exterior_color
      if (row.interior_color) vehicleData.interior_color = row.interior_color
      if (row.transmission) vehicleData.transmission = row.transmission
      if (row.fuel_type) vehicleData.fuel_type = row.fuel_type
      if (row.body_style) vehicleData.body_style = row.body_style
      if (row.auction_location) vehicleData.auction_location = row.auction_location
      if (row.sale_date) vehicleData.sale_date = row.sale_date
      if (row.lot_number) vehicleData.lot_number = row.lot_number
      if (row.primary_damage) vehicleData.primary_damage = row.primary_damage
      if (row.secondary_damage) vehicleData.secondary_damage = row.secondary_damage
      if (row.damage_description) vehicleData.damage_description = row.damage_description
      if (row.damage_severity) vehicleData.damage_severity = row.damage_severity as any
      if (row.repair_estimate) {
        const estimate = parseFloat(row.repair_estimate)
        if (!isNaN(estimate)) vehicleData.repair_estimate = estimate
      }
      if (row.title_status) vehicleData.title_status = row.title_status
      if (row.keys_available) vehicleData.keys_available = row.keys_available.toLowerCase() === 'true'
      if (row.run_and_drive) vehicleData.run_and_drive = row.run_and_drive.toLowerCase() === 'true'
      if (row.purchase_currency) vehicleData.purchase_currency = row.purchase_currency as any
      if (row.estimated_total_cost) {
        const cost = parseFloat(row.estimated_total_cost)
        if (!isNaN(cost)) vehicleData.estimated_total_cost = cost
      }

      // Always add the vehicle data, even if it has validation errors
      parsedData.push(vehicleData as ParsedVehicle)
    }

    setCsvData(parsedData)
    setValidationErrors(errors)
    setDuplicateVins(Array.from(duplicates))
  }

  const handleImport = async () => {
    if (!csvData.length) return

    setImporting(true)
    setImportProgress(0)

    const results: ImportResult = {
      total: csvData.length,
      successful: 0,
      failed: 0,
      errors: []
    }

    for (let i = 0; i < csvData.length; i++) {
      const vehicleData = csvData[i]
      const { originalRow, ...createData } = vehicleData

      try {
        const result = await VehicleService.create(createData, 'current-user-id') // In real app, get from auth context
        
        if (result.success) {
          results.successful++
        } else {
          results.failed++
          results.errors.push({
            row: originalRow,
            error: result.error || 'Unknown error'
          })
        }
      } catch (error: any) {
        results.failed++
        results.errors.push({
          row: originalRow,
          error: error.message || 'Network error'
        })
      }

      setImportProgress(Math.round(((i + 1) / csvData.length) * 100))
    }

    setImportResult(results)
    setImporting(false)
  }

  const handleRetryImport = () => {
    setImportResult(null)
    handleImport()
  }

  const handleReset = () => {
    setSelectedFile(null)
    setCsvData([])
    setValidationErrors([])
    setDuplicateVins([])
    setImportResult(null)
    setFileError(null)
    setImportProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validateManualForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!manualForm.vin) errors.vin = 'VIN is required'
    if (!manualForm.year) errors.year = 'Year is required'
    if (!manualForm.make) errors.make = 'Make is required'
    if (!manualForm.model) errors.model = 'Model is required'
    if (!manualForm.auction_house) errors.auction_house = 'Auction house is required'
    if (!manualForm.purchase_price) errors.purchase_price = 'Purchase price is required'

    setManualErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleManualSubmit = async () => {
    if (!validateManualForm()) return

    try {
      const result = await VehicleService.create(manualForm as CreateVehicleData, 'current-user-id')
      if (result.success) {
        // Reset form
        setManualForm({})
        setManualErrors({})
        // Show success message
      }
    } catch (error) {
      // Handle error
    }
  }

  const hasValidationErrors = validationErrors.length > 0 || duplicateVins.length > 0
  const canImport = csvData.length > 0 && !hasValidationErrors && !importing

  return (
    <main className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Vehicle Import</h1>
        <p className="text-muted-foreground">
          Import vehicles from CSV files or external auction data
        </p>
      </div>

      {/* Import Methods */}
      <Tabs defaultValue="csv" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="csv">CSV Upload</TabsTrigger>
          <TabsTrigger value="auction">Auction API</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        {/* CSV Upload Tab */}
        <TabsContent value="csv" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>
                Select a CSV file containing vehicle data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Drag and drop CSV file here</p>
                <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Browse Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-label="Upload CSV file"
                />
              </div>

              {/* File Info */}
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Supported formats: CSV</p>
                <p>Maximum file size: 10MB</p>
              </div>

              {/* Template Download */}
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <a href="/templates/vehicle-import-template.csv" className="text-sm text-blue-600 hover:underline">
                  Download CSV template
                </a>
              </div>

              {/* Column Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Required Columns</h4>
                  <p className="text-sm text-muted-foreground">
                    vin, year, make, model, auction_house, purchase_price
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Optional Columns</h4>
                  <p className="text-sm text-muted-foreground">
                    engine, mileage, exterior_color, purchase_currency, trim, etc.
                  </p>
                </div>
              </div>

              {/* File Error */}
              {fileError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{fileError}</AlertDescription>
                </Alert>
              )}

              {/* Selected File Info */}
              {selectedFile && !fileError && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {selectedFile.name} - {csvData.length} vehicles detected
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Data Preview */}
          {csvData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">VIN</th>
                        <th className="text-left p-2">Year</th>
                        <th className="text-left p-2">Make</th>
                        <th className="text-left p-2">Model</th>
                        <th className="text-left p-2">Auction House</th>
                        <th className="text-left p-2">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 5).map((vehicle, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2 font-mono text-sm">{vehicle.vin}</td>
                          <td className="p-2">{vehicle.year}</td>
                          <td className="p-2">{vehicle.make}</td>
                          <td className="p-2">{vehicle.model}</td>
                          <td className="p-2">{vehicle.auction_house}</td>
                          <td className="p-2">${vehicle.purchase_price?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvData.length > 5 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Showing 5 of {csvData.length} vehicles
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Validation Errors Found</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {validationErrors.map((error, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">Row {error.row}:</span>{' '}
                      <span className="text-red-600">{error.message}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Duplicate VINs */}
          {duplicateVins.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-yellow-600">Duplicate VINs Detected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {duplicateVins.map((vin, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-mono">{vin}</span>{' '}
                      <span className="text-yellow-600">
                        appears {csvData.filter(v => v.vin === vin).length} times
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Controls */}
          {csvData.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">
                      Ready to import {csvData.length} vehicles
                    </p>
                    {hasValidationErrors && (
                      <p className="text-sm text-red-600">
                        Please fix validation errors before importing
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleReset}>
                      Reset
                    </Button>
                    <Button 
                      onClick={handleImport}
                      disabled={!canImport}
                    >
                      {importing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        `Import ${csvData.length} vehicles`
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Progress */}
          {importing && (
            <Card>
              <CardHeader>
                <CardTitle>Importing Vehicles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Progress value={importProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground">
                    {Math.round((importProgress / 100) * csvData.length)} of {csvData.length} completed
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Results */}
          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle className={
                  importResult.failed === 0 ? 'text-green-600' : 
                  importResult.successful === 0 ? 'text-red-600' : 'text-yellow-600'
                }>
                  {importResult.failed === 0 ? 'Import completed successfully' :
                   importResult.successful === 0 ? 'Import failed' : 'Import completed with errors'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{importResult.successful}</p>
                    <p className="text-sm text-muted-foreground">vehicles imported</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                    <p className="text-sm text-muted-foreground">failed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{importResult.total}</p>
                    <p className="text-sm text-muted-foreground">total</p>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Errors:</h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">Row {error.row}:</span>{' '}
                          <span className="text-red-600">{error.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {importResult.failed > 0 && (
                    <Button variant="outline" onClick={handleRetryImport}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Import
                    </Button>
                  )}
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Results
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Auction API Tab */}
        <TabsContent value="auction" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connect to Auction House APIs</CardTitle>
              <CardDescription>
                Import vehicle data directly from Copart, IAAI, and Manheim
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Supported Auction Houses */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Car className="h-8 w-8 mx-auto mb-2" />
                    <h3 className="font-medium">Copart</h3>
                    <Badge variant="outline">Available</Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Car className="h-8 w-8 mx-auto mb-2" />
                    <h3 className="font-medium">IAAI</h3>
                    <Badge variant="outline">Available</Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Car className="h-8 w-8 mx-auto mb-2" />
                    <h3 className="font-medium">Manheim</h3>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </CardContent>
                </Card>
              </div>

              {/* API Configuration */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="auction-house">Auction House</Label>
                  <Select 
                    value={auctionConfig.house} 
                    onValueChange={(value) => setAuctionConfig(prev => ({ ...prev, house: value }))}
                  >
                    <SelectTrigger id="auction-house" aria-label="Auction house">
                      <SelectValue placeholder="Select auction house" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="copart">Copart</SelectItem>
                      <SelectItem value="iaai">IAAI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Enter your API key"
                    value={auctionConfig.apiKey}
                    onChange={(e) => setAuctionConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    aria-label="API key"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search-criteria">Search Criteria</Label>
                  <Input
                    id="search-criteria"
                    placeholder="e.g., make:Honda year:2020-2023"
                    value={auctionConfig.searchCriteria}
                    onChange={(e) => setAuctionConfig(prev => ({ ...prev, searchCriteria: e.target.value }))}
                    aria-label="Search criteria"
                  />
                </div>

                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Vehicles Manually</CardTitle>
              <CardDescription>
                Enter vehicle information directly into the form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-vin">VIN</Label>
                  <Input
                    id="manual-vin"
                    value={manualForm.vin || ''}
                    onChange={(e) => setManualForm(prev => ({ ...prev, vin: e.target.value }))}
                    aria-label="VIN"
                  />
                  {manualErrors.vin && (
                    <p className="text-sm text-red-600">{manualErrors.vin}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-year">Year</Label>
                  <Input
                    id="manual-year"
                    type="number"
                    value={manualForm.year || ''}
                    onChange={(e) => setManualForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    aria-label="Year"
                  />
                  {manualErrors.year && (
                    <p className="text-sm text-red-600">{manualErrors.year}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-make">Make</Label>
                  <Input
                    id="manual-make"
                    value={manualForm.make || ''}
                    onChange={(e) => setManualForm(prev => ({ ...prev, make: e.target.value }))}
                    aria-label="Make"
                  />
                  {manualErrors.make && (
                    <p className="text-sm text-red-600">{manualErrors.make}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-model">Model</Label>
                  <Input
                    id="manual-model"
                    value={manualForm.model || ''}
                    onChange={(e) => setManualForm(prev => ({ ...prev, model: e.target.value }))}
                    aria-label="Model"
                  />
                  {manualErrors.model && (
                    <p className="text-sm text-red-600">{manualErrors.model}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-auction-house">Auction House</Label>
                  <Input
                    id="manual-auction-house"
                    value={manualForm.auction_house || ''}
                    onChange={(e) => setManualForm(prev => ({ ...prev, auction_house: e.target.value }))}
                    aria-label="Auction house"
                  />
                  {manualErrors.auction_house && (
                    <p className="text-sm text-red-600">{manualErrors.auction_house}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-price">Purchase Price</Label>
                  <Input
                    id="manual-price"
                    type="number"
                    value={manualForm.purchase_price || ''}
                    onChange={(e) => setManualForm(prev => ({ ...prev, purchase_price: parseFloat(e.target.value) }))}
                    aria-label="Purchase price"
                  />
                  {manualErrors.purchase_price && (
                    <p className="text-sm text-red-600">{manualErrors.purchase_price}</p>
                  )}
                </div>
              </div>

              <Button onClick={handleManualSubmit}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Import History
          </CardTitle>
          <CardDescription>
            Recent import activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4" />
            <p>No import history found</p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}