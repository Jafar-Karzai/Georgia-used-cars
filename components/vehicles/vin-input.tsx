'use client'

import { useState } from 'react'
import { VinDecoderService, VinData } from '@/lib/services/vin-decoder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Search, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface VinInputProps {
  value: string
  onChange: (vin: string) => void
  onVinDecoded?: (data: VinData) => void
  disabled?: boolean
}

export function VinInput({ value, onChange, onVinDecoded, disabled }: VinInputProps) {
  const [loading, setLoading] = useState(false)
  const [decodedData, setDecodedData] = useState<VinData | null>(null)
  const [error, setError] = useState<string>('')
  const [isValid, setIsValid] = useState<boolean | null>(null)

  const handleVinChange = (newVin: string) => {
    const cleanVin = newVin.toUpperCase().replace(/[^A-Z0-9]/g, '')
    onChange(cleanVin)
    
    // Reset states when VIN changes
    setDecodedData(null)
    setError('')
    
    // Validate format
    if (cleanVin.length === 17) {
      setIsValid(VinDecoderService.validateVin(cleanVin))
    } else {
      setIsValid(null)
    }
  }

  const handleDecodeVin = async () => {
    if (!value || value.length !== 17) {
      setError('Please enter a complete 17-character VIN')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await VinDecoderService.decodeVin(value)
      
      if (result.success && result.data) {
        setDecodedData(result.data)
        setIsValid(true)
        onVinDecoded?.(result.data)
      } else {
        setError(result.error || 'Failed to decode VIN')
        setIsValid(false)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to decode VIN')
      setIsValid(false)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.length === 17 && !loading) {
      handleDecodeVin()
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="vin">Vehicle Identification Number (VIN)</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="vin"
              value={value}
              onChange={(e) => handleVinChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter 17-character VIN"
              maxLength={17}
              disabled={disabled || loading}
              className={`pr-10 font-mono ${
                isValid === true ? 'border-green-500' : 
                isValid === false ? 'border-red-500' : ''
              }`}
            />
            {/* Status indicator */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : isValid === true ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : isValid === false ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : null}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleDecodeVin}
            disabled={!value || value.length !== 17 || loading || disabled}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Decode
          </Button>
        </div>
        
        {/* Character counter */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>VIN must be exactly 17 characters</span>
          <span className={value.length === 17 ? 'text-green-600' : ''}>
            {value.length}/17
          </span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <XCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Decoded data display */}
      {decodedData && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Decoded Vehicle Information</h4>
                <Badge variant="outline" className="text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Valid VIN
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {decodedData.year && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Year:</span>
                    <span className="font-medium">{decodedData.year}</span>
                  </div>
                )}
                {decodedData.make && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Make:</span>
                    <span className="font-medium">{decodedData.make}</span>
                  </div>
                )}
                {decodedData.model && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model:</span>
                    <span className="font-medium">{decodedData.model}</span>
                  </div>
                )}
                {decodedData.trim && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trim:</span>
                    <span className="font-medium">{decodedData.trim}</span>
                  </div>
                )}
                {decodedData.engine && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Engine:</span>
                    <span className="font-medium">{decodedData.engine}</span>
                  </div>
                )}
                {decodedData.transmission && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transmission:</span>
                    <span className="font-medium">{decodedData.transmission}</span>
                  </div>
                )}
                {decodedData.fuel_type && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fuel Type:</span>
                    <span className="font-medium">{decodedData.fuel_type}</span>
                  </div>
                )}
                {decodedData.body_style && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Body Style:</span>
                    <span className="font-medium">{decodedData.body_style}</span>
                  </div>
                )}
              </div>
              
              {decodedData.manufacturer && (
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Manufacturer:</span>
                    <span>{decodedData.manufacturer}</span>
                  </div>
                  {decodedData.plant_country && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Plant Country:</span>
                      <span>{decodedData.plant_country}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}