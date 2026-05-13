import { NextResponse } from 'next/server'
import {
  InputValidationError,
  isInputValidationError,
  parseOptionalDate,
  validationErrorResponse
} from '@/lib/api-validation'

const ASSIGNMENT_STATUSES = new Set(['ACTIVE', 'INACTIVE', 'REVOKED'])

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

function parseStatus(value: unknown): string {
  const status = value === undefined || value === null || value === '' ? 'ACTIVE' : requiredString(value, 'Status').toUpperCase()
  if (!ASSIGNMENT_STATUSES.has(status)) {
    throw new InputValidationError('Status must be one of ACTIVE, INACTIVE, or REVOKED')
  }
  return status
}

export function parseAssignmentPayload(body: unknown) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new InputValidationError('Request body must be an object')
  }

  const payload = body as Record<string, unknown>
  const assignedAt = parseOptionalDate(payload.assignedAt, 'Assigned at')

  return {
    softwareId: requiredString(payload.softwareId, 'Software ID'),
    userId: requiredString(payload.userId, 'User ID'),
    assignedBy: optionalString(payload.assignedBy),
    ...(assignedAt ? { assignedAt } : {}),
    status: parseStatus(payload.status),
    notes: optionalString(payload.notes)
  }
}

export function assignmentValidationResponse(error: unknown) {
  if (isInputValidationError(error)) {
    return validationErrorResponse(error)
  }

  if (isForeignKeyError(error)) {
    return NextResponse.json({ error: 'Software does not exist' }, { status: 400 })
  }

  return null
}

export function isRecordNotFoundError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2025'
}

function isForeignKeyError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2003'
}
