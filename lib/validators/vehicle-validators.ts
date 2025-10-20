/**
 * Shared vehicle validation utilities
 * Used across POST, PUT, and form validation to ensure consistency
 */

import type { VehicleStatus, DamageSeverity, CurrencyCode } from '@/types/database'

export const VALID_STATUSES: VehicleStatus[] = [
  'auction_won', 'payment_processing', 'pickup_scheduled', 'in_transit_to_port',
  'at_port', 'shipped', 'in_transit', 'at_uae_port', 'customs_clearance',
  'released_from_customs', 'in_transit_to_yard', 'at_yard', 'under_enhancement',
  'ready_for_sale', 'reserved', 'sold', 'delivered'
]

export const VALID_DAMAGE_SEVERITIES: DamageSeverity[] = ['minor', 'moderate', 'major', 'total_loss']
export const VALID_CURRENCIES: CurrencyCode[] = ['USD', 'CAD', 'AED']
export const VALID_SALE_TYPES = ['local_only', 'export_only', 'local_and_export']

export interface ValidationError {
  field: string
  message: string
}

/**
 * Type guard to check if string is a valid VehicleStatus
 */
export function isValidStatus(status: string): status is VehicleStatus {
  return VALID_STATUSES.includes(status as VehicleStatus)
}

/**
 * Type guard to check if string is a valid DamageSeverity
 */
export function isValidDamageSeverity(severity: string): severity is DamageSeverity {
  return VALID_DAMAGE_SEVERITIES.includes(severity as DamageSeverity)
}

/**
 * Type guard to check if string is a valid CurrencyCode
 */
export function isValidCurrency(currency: string): currency is CurrencyCode {
  return VALID_CURRENCIES.includes(currency as CurrencyCode)
}

/**
 * Common business logic validation for vehicle creation and updates
 * Used by both POST and PUT endpoints
 */
export function validateBusinessLogic(data: any): ValidationError[] {
  const errors: ValidationError[] = []

  // Sale type and currency constraints
  if (data.sale_type === 'local_only' && data.sale_currency && !isValidCurrency(data.sale_currency)) {
    errors.push({ field: 'sale_currency', message: `Invalid currency. Must be one of: ${VALID_CURRENCIES.join(', ')}` })
  }

  if (data.sale_type === 'local_only' && data.sale_currency && data.sale_currency !== 'AED') {
    errors.push({ field: 'sale_currency', message: 'Local sales must use AED currency' })
  }

  if (data.sale_price !== undefined && data.sale_price > 0 && !data.sale_currency) {
    errors.push({ field: 'sale_currency', message: 'Sale currency is required when sale price is specified' })
  }

  return errors
}

/**
 * Validate numeric fields (prices, costs, mileage)
 */
export function validateNumericFields(data: any): ValidationError[] {
  const errors: ValidationError[] = []

  if (data.mileage !== undefined && (typeof data.mileage !== 'number' || data.mileage < 0)) {
    errors.push({ field: 'mileage', message: 'Mileage must be a non-negative number' })
  }

  if (data.purchase_price !== undefined && (typeof data.purchase_price !== 'number' || data.purchase_price <= 0)) {
    errors.push({ field: 'purchase_price', message: 'Purchase price must be positive' })
  }

  if (data.sale_price !== undefined && (typeof data.sale_price !== 'number' || data.sale_price < 0)) {
    errors.push({ field: 'sale_price', message: 'Sale price must be non-negative' })
  }

  if (data.repair_estimate !== undefined && (typeof data.repair_estimate !== 'number' || data.repair_estimate < 0)) {
    errors.push({ field: 'repair_estimate', message: 'Repair estimate must be non-negative' })
  }

  if (data.estimated_total_cost !== undefined && (typeof data.estimated_total_cost !== 'number' || data.estimated_total_cost < 0)) {
    errors.push({ field: 'estimated_total_cost', message: 'Estimated total cost must be non-negative' })
  }

  return errors
}

/**
 * Validate VIN format (exactly 17 characters)
 */
export function validateVIN(vin: string): ValidationError[] {
  const errors: ValidationError[] = []

  if (!vin) {
    errors.push({ field: 'vin', message: 'VIN is required' })
  } else if (typeof vin !== 'string' || vin.length !== 17) {
    errors.push({ field: 'vin', message: 'VIN must be exactly 17 characters' })
  }

  return errors
}

/**
 * Validate year field
 */
export function validateYear(year: number | undefined): ValidationError[] {
  const errors: ValidationError[] = []
  const currentYear = new Date().getFullYear()

  if (year === undefined) {
    errors.push({ field: 'year', message: 'Year is required' })
  } else if (typeof year !== 'number' || year < 1900 || year > currentYear + 1) {
    errors.push({ field: 'year', message: `Year must be between 1900 and ${currentYear + 1}` })
  }

  return errors
}

/**
 * Validate required string fields
 */
export function validateRequiredStrings(data: any): ValidationError[] {
  const errors: ValidationError[] = []

  if (!data.make) {
    errors.push({ field: 'make', message: 'Make is required' })
  }

  if (!data.model) {
    errors.push({ field: 'model', message: 'Model is required' })
  }

  if (!data.auction_house) {
    errors.push({ field: 'auction_house', message: 'Auction house is required' })
  }

  return errors
}

/**
 * Validate enum fields
 */
export function validateEnumFields(data: any): ValidationError[] {
  const errors: ValidationError[] = []

  if (data.damage_severity && !isValidDamageSeverity(data.damage_severity)) {
    errors.push({ field: 'damage_severity', message: `Invalid damage severity. Must be one of: ${VALID_DAMAGE_SEVERITIES.join(', ')}` })
  }

  if (data.purchase_currency && !isValidCurrency(data.purchase_currency)) {
    errors.push({ field: 'purchase_currency', message: `Invalid currency. Must be one of: ${VALID_CURRENCIES.join(', ')}` })
  }

  if (data.sale_currency && !isValidCurrency(data.sale_currency)) {
    errors.push({ field: 'sale_currency', message: `Invalid currency. Must be one of: ${VALID_CURRENCIES.join(', ')}` })
  }

  if (data.sale_type && !VALID_SALE_TYPES.includes(data.sale_type)) {
    errors.push({ field: 'sale_type', message: `Invalid sale type. Must be one of: ${VALID_SALE_TYPES.join(', ')}` })
  }

  if (data.sale_price_includes_vat !== undefined && typeof data.sale_price_includes_vat !== 'boolean') {
    errors.push({ field: 'sale_price_includes_vat', message: 'sale_price_includes_vat must be a boolean' })
  }

  return errors
}

/**
 * Comprehensive validation for vehicle creation
 */
export function validateCreateVehicleData(data: any): ValidationError[] {
  const errors: ValidationError[] = []

  errors.push(...validateVIN(data.vin))
  errors.push(...validateYear(data.year))
  errors.push(...validateRequiredStrings(data))
  errors.push(...validateNumericFields(data))
  errors.push(...validateEnumFields(data))
  errors.push(...validateBusinessLogic(data))

  return errors
}

/**
 * Comprehensive validation for vehicle updates (partial validation)
 */
export function validateUpdateVehicleData(data: any): ValidationError[] {
  const errors: ValidationError[] = []

  // VIN validation (if provided)
  if (data.vin !== undefined) {
    errors.push(...validateVIN(data.vin))
  }

  // Year validation (if provided)
  if (data.year !== undefined) {
    errors.push(...validateYear(data.year))
  }

  // Numeric validations (partial)
  errors.push(...validateNumericFields(data))

  // Enum validations
  errors.push(...validateEnumFields(data))

  // Business logic
  errors.push(...validateBusinessLogic(data))

  // Status validation (if provided)
  if (data.current_status && !isValidStatus(data.current_status)) {
    errors.push({ field: 'current_status', message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` })
  }

  return errors
}
