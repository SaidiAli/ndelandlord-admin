"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Property } from "@/types"
import Link from "next/link"

interface ColumnsProps {
  onViewDetails: (propertyId: string) => void;
}

export const getColumns = ({ onViewDetails }: ColumnsProps): ColumnDef<Property>[] => [
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
    cell: ({ row }) => {
      const property = row.original
      return (
        <Link href={`/properties/${property.id}`} className="font-medium hover:underline">
          {property.name}
        </Link>
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
    accessorKey: "units",
    header: "Units",
  },
  {
    accessorKey: "occupancy",
    header: "% Occupancy",
  },
  {
    accessorKey: "expected",
    header: "Expected",
  },
  {
    accessorKey: "outstanding",
    header: "Outstanding Balance",
  },
  {
    id: "viewDetails",
    header: "Details",
    cell: ({ row }) => {
      const property = row.original
      return (
        <div
          className="cursor-pointer"
          onClick={() => onViewDetails(property.id)}
        >
          <Eye className="h-4 w-4 mr-2" />
        </div>
      )
    },
  },
]
