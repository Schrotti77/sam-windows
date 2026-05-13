import { NextResponse } from 'next/server'
import {
  InputValidationError,
  isInputValidationError,
  parseOptionalDate,
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

const CONTRACT_STATUSES = new Set(['ACTIVE', 'PENDING', 'EXPIRED', 'TERMINATED'])

function parseStatus(value: unknown): string {
  const status = value === undefined || value === null || value === ''
    ? 'ACTIVE'
    : requiredString(value, 'Status').toUpperCase()

  if (!CONTRACT_STATUSES.has(status)) {
    throw new InputValidationError('Status must be one of ACTIVE, PENDING, EXPIRED, or TERMINATED')
  }

  return status
}

export function parseContractPayload(body: any) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new InputValidationError('Request body must be an object')
  }

  const startDate = parseRequiredDate(body.startDate, 'Start date')
  const endDate = parseRequiredDate(body.endDate, 'End date')

  if (endDate < startDate) {
    throw new InputValidationError('End date must be on or after start date')
  }

  return {
    vendorId: requiredString(body.vendorId, 'Vendor ID'),
    contractNumber: requiredString(body.contractNumber, 'Contract number'),
    title: requiredString(body.title, 'Title'),
    startDate,
    endDate,
    renewalDate: parseOptionalDate(body.renewalDate, 'Renewal date'),
    contractValue: parseRequiredNumber(body.contractValue, 'Contract value', { min: 0 }),
    paymentTerms: optionalString(body.paymentTerms),
    renewalTerms: optionalString(body.renewalTerms),
    status: parseStatus(body.status),
    notes: optionalString(body.notes)
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002'
}

function isForeignKeyConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2003'
}

export function contractValidationResponse(error: unknown) {
  if (isInputValidationError(error)) {
    return validationErrorResponse(error)
  }
  if (isUniqueConstraintError(error)) {
    return NextResponse.json({ error: 'Contract number must be unique' }, { status: 400 })
  }
  if (isForeignKeyConstraintError(error)) {
    return NextResponse.json({ error: 'Vendor does not exist' }, { status: 400 })
  }
  return null
}

export function isRecordNotFoundError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2025'
}
