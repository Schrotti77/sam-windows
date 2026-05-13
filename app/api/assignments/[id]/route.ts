export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireApiAuth } from '@/lib/simple-auth'
import { assignmentValidationResponse, isRecordNotFoundError, parseAssignmentPayload } from '@/lib/assignment-validation'

const assignmentInclude = {
  software: {
    select: {
      id: true,
      name: true,
      vendor: {
        select: {
          id: true,
          name: true
        }
      }
    }
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const assignment = await prisma.softwareAssignment.findUnique({
      where: { id: params.id },
      include: assignmentInclude
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Assignment fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch assignment' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authError = await requireApiAuth()
  if (authError) return authError

  try {
    let body: unknown
    try {
      body = await request.json()
    } catch (_error) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const data = parseAssignmentPayload(body)

    const assignment = await prisma.softwareAssignment.update({
      where: { id: params.id },
      data,
      include: assignmentInclude
    })

    return NextResponse.json(assignment)
  } catch (error) {
    const handled = assignmentValidationResponse(error)
    if (handled) return handled

    if (isRecordNotFoundError(error)) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    console.error('Assignment update error:', error)
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const authError = await requireApiAuth()
  if (authError) return authError

  try {
    await prisma.softwareAssignment.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    console.error('Assignment deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
  }
}
