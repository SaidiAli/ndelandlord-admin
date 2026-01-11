"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, Edit } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Unit } from "@/types"
import { formatUGX } from "@/lib/currency"

interface ColumnsProps {
  onViewDetails: (unitId: string) => void;
  onEdit: (unit: Unit) => void;
}

export const getColumns = ({ onViewDetails, onEdit }: ColumnsProps): ColumnDef<Unit>[] => [
  {
    accessorKey: "unitNumber",
    header: ({ column }) => {
      return (
        <Button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Unit No.
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.unitNumber}</div>
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
    accessorKey: "bedrooms",
    header: "Bedrooms",
  },
  {
    accessorKey: "bathrooms",
    header: "Bathrooms",
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
        <Button
          onClick={() => onViewDetails(unit.id)}
        >
          <Eye className="h-4 w-4 mr-2" />
          View
        </Button>
      )
    },
  },
  {
    id: "edit",
    header: "Edit",
    cell: ({ row }) => {
      const unit = row.original
      return (
        <Button
          onClick={() => onEdit(unit)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      )
    },
  },
]