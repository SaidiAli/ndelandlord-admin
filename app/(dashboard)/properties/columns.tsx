"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Property } from "@/types"

interface ColumnsProps {
  onViewDetails: (propertyId: string) => void;
  onEdit: (propertyId: string) => void;
}

export const getColumns = ({ onViewDetails, onEdit }: ColumnsProps): ColumnDef<Property>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <div
        className="flex flex-row"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      )
    },
  },
  {
    accessorKey: "address",
    header: "Address",
  },
  {
    accessorKey: "city",
    header: "City",
  },
  {
    id: "viewDetails",
    header: "Details",
    cell: ({ row }) => {
      const property = row.original
      return (
        <Button
          onClick={() => onViewDetails(property.id)}
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
      const property = row.original
      return (
        <Button
          onClick={() => onEdit(property.id)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      )
    },
  },
]
