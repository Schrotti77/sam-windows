export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireApiAuth } from '@/lib/simple-auth'
import { assignmentValidationResponse, parseAssignmentPayload } from '@/lib/assignment-validation'

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

export async function GET() {
  try {
    const assignments = await prisma.softwareAssignment.findMany({
      include: assignmentInclude,
      orderBy: { assignedAt: 'desc' }
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Assignments fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
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

    const assignment = await prisma.softwareAssignment.create({
      data,
      include: assignmentInclude
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    const handled = assignmentValidationResponse(error)
    if (handled) return handled

    console.error('Assignment creation error:', error)
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
  }
}
