"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Lease } from "@/types"

export const columns: ColumnDef<Lease>[] = [
  {
    accessorKey: "tenant",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const tenant = row.original.tenant;
      return <div className="font-medium">{tenant?.firstName} {tenant?.lastName}</div>
    },
  },
  {
    accessorKey: "unit",
    header: "Property & Unit",
    cell: ({ row }) => {
        const lease = row.original;
        return <span>{lease.unit?.property?.name} - Unit {lease.unit?.unitNumber}</span>
    }
  },
  {
    accessorKey: "status",
    header: "Lease Status",
    cell: ({ row }) => {
      const lease = row.original;
      return <Badge variant={lease.status === 'active' ? 'default' : 'secondary'}>{lease.status}</Badge>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const lease = row.original
 
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(lease.tenant?.id || '')}
            >
              Copy tenant ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit tenant</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]