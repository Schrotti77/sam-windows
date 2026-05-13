import { NextResponse } from 'next/server'

export class InputValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InputValidationError'
  }
}

export function isInputValidationError(error: unknown): error is InputValidationError {
  return error instanceof InputValidationError
}

export function validationErrorResponse(error: InputValidationError) {
  return NextResponse.json({ error: error.message }, { status: 400 })
}

type NumberOptions = {
  min?: number
  integer?: boolean
}

function isBlankString(value: unknown): boolean {
  return typeof value === 'string' && value.trim() === ''
}

function toFiniteNumber(value: unknown, fieldName: string): number {
  if (isBlankString(value)) {
    throw new InputValidationError(`${fieldName} must be a valid number`)
  }

  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) {
    throw new InputValidationError(`${fieldName} must be a valid number`)
  }
  return parsed
}

function assertNumberOptions(value: number, fieldName: string, options: NumberOptions = {}) {
  if (options.integer && !Number.isInteger(value)) {
    throw new InputValidationError(`${fieldName} must be a whole number`)
  }
  if (options.min !== undefined && value < options.min) {
    throw new InputValidationError(`${fieldName} must be at least ${options.min}`)
  }
}

export function parseRequiredNumber(value: unknown, fieldName: string, options: NumberOptions = {}): number {
  if (value === undefined || value === null || value === '' || isBlankString(value)) {
    throw new InputValidationError(`${fieldName} is required`)
  }

  const parsed = toFiniteNumber(value, fieldName)
  assertNumberOptions(parsed, fieldName, options)
  return parsed
}

export function parseOptionalNumber(value: unknown, fieldName: string, options: NumberOptions = {}): number | null {
  if (value === undefined || value === null || value === '' || isBlankString(value)) {
    return null
  }

  const parsed = toFiniteNumber(value, fieldName)
  assertNumberOptions(parsed, fieldName, options)
  return parsed
}

function parseDate(value: unknown, fieldName: string): Date {
  const parsed = new Date(value as string | number | Date)
  if (Number.isNaN(parsed.getTime())) {
    throw new InputValidationError(`${fieldName} must be a valid date`)
  }
  return parsed
}

export function parseRequiredDate(value: unknown, fieldName: string): Date {
  if (value === undefined || value === null || value === '' || isBlankString(value)) {
    throw new InputValidationError(`${fieldName} is required`)
  }
  return parseDate(value, fieldName)
}

export function parseOptionalDate(value: unknown, fieldName: string): Date | null {
  if (value === undefined || value === null || value === '' || isBlankString(value)) {
    return null
  }
  return parseDate(value, fieldName)
}
