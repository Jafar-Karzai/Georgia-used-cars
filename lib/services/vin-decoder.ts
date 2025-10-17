// VIN Decoder Service using NHTSA vPIC API (free)
// Documentation: https://vpic.nhtsa.dot.gov/api/

export interface VinData {
  year?: number
  make?: string
  model?: string
  trim?: string
  engine?: string
  transmission?: string
  fuel_type?: string
  body_style?: string
  manufacturer?: string
  plant_country?: string
  error?: string
}

export class VinDecoderService {
  private static readonly NHTSA_API_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles'

  // Validate VIN format
  static validateVin(vin: string): boolean {
    // Basic VIN validation: 17 characters, alphanumeric except I, O, Q
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/
    return vinRegex.test(vin.toUpperCase())
  }

  // Decode VIN using NHTSA API
  static async decodeVin(vin: string): Promise<{ success: boolean; data?: VinData; error?: string }> {
    try {
      if (!this.validateVin(vin)) {
        return { success: false, error: 'Invalid VIN format' }
      }

      const response = await fetch(
        `${this.NHTSA_API_BASE}/DecodeVin/${vin.toUpperCase()}?format=json`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.Results || data.Results.length === 0) {
        return { success: false, error: 'No data found for this VIN' }
      }

      // Parse the results
      const results = data.Results
      const vinData: VinData = {}

      // Map NHTSA fields to our format
      const fieldMap = {
        'Model Year': 'year',
        'Make': 'make',
        'Model': 'model',
        'Trim': 'trim',
        'Engine Model': 'engine',
        'Transmission Style': 'transmission',
        'Fuel Type - Primary': 'fuel_type',
        'Body Class': 'body_style',
        'Manufacturer Name': 'manufacturer',
        'Plant Country': 'plant_country'
      }

      results.forEach((result: any) => {
        const { Variable, Value } = result
        
        if (fieldMap[Variable as keyof typeof fieldMap] && Value && Value !== 'Not Applicable' && Value !== '') {
          const fieldKey = fieldMap[Variable as keyof typeof fieldMap] as keyof VinData
          
          if (fieldKey === 'year') {
            vinData[fieldKey] = parseInt(Value, 10)
          } else {
            vinData[fieldKey] = Value
          }
        }
      })

      // Validate that we got essential data
      if (!vinData.make || !vinData.model || !vinData.year) {
        return { 
          success: false, 
          error: 'Incomplete vehicle data - VIN may be invalid or not in database' 
        }
      }

      return { success: true, data: vinData }

    } catch (error: any) {
      console.error('VIN decode error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to decode VIN' 
      }
    }
  }

  // Get vehicle makes for a specific year
  static async getMakesForYear(year: number): Promise<{ success: boolean; data?: string[]; error?: string }> {
    try {
      const response = await fetch(
        `${this.NHTSA_API_BASE}/GetMakesForVehicleType/car?format=json`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.Results) {
        return { success: false, error: 'No makes data available' }
      }

      const makes = data.Results.map((result: any) => result.MakeName).sort()
      return { success: true, data: makes }

    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to get makes' 
      }
    }
  }

  // Get models for a specific make and year
  static async getModelsForMakeYear(make: string, year: number): Promise<{ success: boolean; data?: string[]; error?: string }> {
    try {
      const response = await fetch(
        `${this.NHTSA_API_BASE}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.Results) {
        return { success: false, error: 'No models data available' }
      }

      const models = data.Results.map((result: any) => result.Model_Name).sort()
      return { success: true, data: models }

    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to get models' 
      }
    }
  }

  // Format engine information
  static formatEngineInfo(engineModel?: string, displacement?: string, cylinders?: string): string {
    const parts = []
    
    if (displacement) parts.push(displacement)
    if (cylinders) parts.push(`${cylinders} cyl`)
    if (engineModel) parts.push(engineModel)
    
    return parts.join(' ') || 'Unknown'
  }

  // Clean and format text data
  static cleanText(text: string): string {
    if (!text) return ''
    
    return text
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s-_.]/g, '') // Remove special characters except common ones
  }

  // Check if VIN is from a known auction
  static getAuctionInfo(vin: string): { auction?: string; likely: boolean } {
    // This is a basic implementation - in practice, you'd have more sophisticated logic
    // based on VIN patterns, seller information, etc.
    
    const vinUpper = vin.toUpperCase()
    
    // Some basic patterns (these are examples and may not be accurate)
    // In practice, you'd determine auction source from other data
    
    return {
      likely: false // Default to unknown auction source
    }
  }
}