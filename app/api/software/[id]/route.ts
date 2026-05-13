export const dynamic = 'force-dynamic'



import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireApiAuth } from '@/lib/simple-auth'

function dependencyBlockResponse(counts: { licenses: number; costs: number; alerts: number; assignments: number }) {
  return NextResponse.json(
    {
      error: 'Software cannot be deleted. Remove associated licenses, costs, alerts, and assignments first.',
      canDelete: false,
      counts
    },
    { status: 400 }
  )
}

function isForeignKeyConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2003'
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authError = await requireApiAuth()
  if (authError) return authError
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Software ID is required' },
        { status: 400 }
      )
    }

    // Check if software exists
    const existingSoftware = await prisma.software.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            licenses: true,
            costs: true,
            alerts: true,
            assignments: true
          }
        }
      }
    })

    if (!existingSoftware) {
      return NextResponse.json(
        { error: 'Software not found' },
        { status: 404 }
      )
    }

    const dependencyCounts = existingSoftware._count
    const hasDependencies = dependencyCounts.licenses > 0 || dependencyCounts.costs > 0 || dependencyCounts.alerts > 0 || dependencyCounts.assignments > 0

    if (hasDependencies) {
      return dependencyBlockResponse(dependencyCounts)
    }

    await prisma.software.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Software successfully deleted' },
      { status: 200 }
    )

  } catch (error) {
    if (isForeignKeyConstraintError(error)) {
      return dependencyBlockResponse({ licenses: 0, costs: 0, alerts: 0, assignments: 0 })
    }

    console.error('Software deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Software ID is required' },
        { status: 400 }
      )
    }

    const software = await prisma.software.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            name: true
          }
        },
        licenses: true,
        assignments: true,
        costs: true,
        _count: {
          select: {
            licenses: true,
            assignments: true,
            costs: true
          }
        }
      }
    })

    if (!software) {
      return NextResponse.json(
        { error: 'Software not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(software)

  } catch (error) {
    console.error('Software fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
