"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Unit } from "@/types"
import Link from "next/link"

export const getColumns = (): ColumnDef<Unit>[] => [
  {
    accessorKey: "unitNumber",
    header: ({ column }) => {
      return (
        <div
          className="flex"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Unit No.
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      )
    },
    cell: ({ row }) => {
      return <Link href={`/units/${row.original.id}`} className="font-medium">{row.original.unitNumber}</Link>
    }
  },
  {
    accessorKey: "property.name",
    header: "Property",
    cell: ({ row }) => {
      return <span>{row.original.property?.name}</span>
    }
  },
  {
    id: "tenant",
    header: "Tenant",
    cell: ({ row }) => { }
  },
  {
    id: "rent",
    header: "Rent",
    cell: ({ row }) => { }
  },
  {
    id: "outstanding",
    header: "Outstanding Balance",
    cell: ({ row }) => { }
  },
  {
    accessorKey: "isAvailable",
    header: "Status",
    cell: ({ row }) => {
      const isAvailable = row.getValue("isAvailable")
      return <Badge className={isAvailable ? "" : "bg-secondary text-white"}>{isAvailable ? "Available" : "Occupied"}</Badge>
    }
  },
  {
    id: "viewDetails",
    header: "Details",
    cell: ({ row }) => {
      const unit = row.original
      return (
        <Link href={`/units/${unit.id}`}>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            View
          </div>
        </Link>
      )
    },
  }
]
