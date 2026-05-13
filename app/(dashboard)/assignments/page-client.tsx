'use client'

import { useEffect, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Plus, RefreshCw, Trash2, UserCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import AddAssignmentDialog from '@/components/assignments/add-assignment-dialog'
import EditAssignmentDialog from '@/components/assignments/edit-assignment-dialog'
import DeleteAssignmentDialog from '@/components/assignments/delete-assignment-dialog'

type Assignment = {
  id: string
  softwareId: string
  userId: string
  assignedBy?: string | null
  assignedAt: string
  status: string
  notes?: string | null
  software?: {
    id?: string
    name?: string | null
    vendor?: { name?: string | null } | null
  } | null
}

const formatDate = (value: string | null | undefined) => value ? new Date(value).toLocaleDateString() : '—'

export default function AssignmentsPageClient() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const loadAssignments = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/assignments')
      if (!response.ok) throw new Error('Failed to load assignments')
      const data = await response.json()
      setAssignments(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssignments()
  }, [])

  const activeAssignments = assignments.filter((assignment) => assignment.status === 'ACTIVE').length
  const revokedAssignments = assignments.filter((assignment) => assignment.status === 'REVOKED').length

  const columns: ColumnDef<Assignment>[] = [
    { id: 'software', header: 'Software', cell: ({ row }) => row.original.software?.name || row.original.softwareId },
    { id: 'vendor', header: 'Vendor', cell: ({ row }) => row.original.software?.vendor?.name || '—' },
    { accessorKey: 'userId', header: 'User ID' },
    { accessorKey: 'assignedBy', header: 'Assigned By', cell: ({ row }) => row.original.assignedBy || '—' },
    { id: 'assignedAt', header: 'Assigned At', cell: ({ row }) => formatDate(row.original.assignedAt) },
    { id: 'status', header: 'Status', cell: ({ row }) => <Badge variant={row.original.status === 'ACTIVE' ? 'default' : 'secondary'}>{row.original.status}</Badge> },
    { accessorKey: 'notes', header: 'Notes', cell: ({ row }) => row.original.notes || '—' },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const assignment = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label={`Actions for ${assignment.userId}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedAssignment(assignment)
                  setEditDialogOpen(true)
                }}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => {
                  setSelectedAssignment(assignment)
                  setDeleteDialogOpen(true)
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <UserCheck className="w-8 h-8 mr-3" />
            Software Assignments
          </h1>
          <p className="text-muted-foreground">Manage software-to-user assignments from the assignments API.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadAssignments} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <AddAssignmentDialog
            onAssignmentAdded={loadAssignments}
            trigger={(
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Assignment
              </Button>
            )}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>Total Assignments</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{assignments.length}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Active</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{activeAssignments}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Revoked</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{revokedAssignments}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Assignments</CardTitle></CardHeader>
        <CardContent>
          {error && <div className="mb-4 rounded-md border border-red-200 p-3 text-sm text-red-600">{error}</div>}
          {loading ? <div className="text-sm text-muted-foreground">Loading assignments...</div> : <DataTable columns={columns} data={assignments} />}
        </CardContent>
      </Card>

      <EditAssignmentDialog
        assignment={selectedAssignment}
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onAssignmentUpdated={loadAssignments}
      />
      <DeleteAssignmentDialog
        assignment={selectedAssignment}
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onAssignmentDeleted={loadAssignments}
      />
    </div>
  )
}
