export const dynamic = 'force-dynamic'



import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(
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

    // Check if software exists
    const existingSoftware = await prisma.software.findUnique({
      where: { id }
    })

    if (!existingSoftware) {
      return NextResponse.json(
        { error: 'Software not found' },
        { status: 404 }
      )
    }

    // Delete the software (this will cascade delete assignments, licenses, costs due to Prisma schema)
    await prisma.software.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Software successfully deleted' },
      { status: 200 }
    )

  } catch (error) {
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
