import { NextResponse } from 'next/server'
import {
  InputValidationError,
  isInputValidationError,
  parseOptionalNumber,
  parseRequiredDate,
  parseRequiredNumber,
  validationErrorResponse
} from '@/lib/api-validation'

function requiredString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new InputValidationError(`${fieldName} is required`)
  }
  return value.trim()
}

function optionalString(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null
  return value.trim()
}

export function parseBudgetPayload(body: any) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new InputValidationError('Request body must be an object')
  }

  const budgetAmount = parseRequiredNumber(body.budgetAmount, 'Budget amount', { min: 0 })
  const spentAmount = parseOptionalNumber(body.spentAmount, 'Spent amount', { min: 0 }) ?? 0

  if (spentAmount > budgetAmount) {
    throw new InputValidationError('Spent amount cannot exceed budget amount')
  }

  const fiscalYear = parseRequiredNumber(body.fiscalYear, 'Fiscal year', { min: 1970, integer: true })
  const startDate = parseRequiredDate(body.startDate, 'Start date')
  const endDate = parseRequiredDate(body.endDate, 'End date')

  if (startDate.getUTCFullYear() !== fiscalYear || endDate.getUTCFullYear() !== fiscalYear) {
    throw new InputValidationError('Fiscal year must match the budget date range')
  }

  if (endDate < startDate) {
    throw new InputValidationError('End date must be on or after start date')
  }

  return {
    name: requiredString(body.name, 'Name'),
    department: optionalString(body.department),
    category: optionalString(body.category),
    budgetAmount,
    spentAmount,
    remainingAmount: budgetAmount - spentAmount,
    fiscalYear,
    startDate,
    endDate,
    notes: optionalString(body.notes)
  }
}

export function budgetValidationResponse(error: unknown) {
  if (isInputValidationError(error)) {
    return validationErrorResponse(error)
  }
  return null
}

export function isRecordNotFoundError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2025'
}
