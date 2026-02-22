"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Property } from "@/types"
import { formatUGX } from "@/lib/currency"
import Link from "next/link"

export const getColumns = (): ColumnDef<Property>[] => [
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
    id: "location",
    header: "Address",
    cell: ({ row }) => {
      const { address, city } = row.original;
      return `${address} - ${city}`;
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.type;
      return (
        <Badge className={type === 'commercial' ? 'bg-blue-500' : 'bg-green-500'}>
          {type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Residential'}
        </Badge>
      );
    },
  },
  {
    accessorKey: "numberOfUnits",
    header: "Units",
  },
  {
    accessorKey: "occupiedUnits",
    header: "Occupied",
    cell: ({ row }) => row.original.occupiedUnits ?? "—",
  },
  {
    id: "emptyUnits",
    header: "Empty",
    cell: ({ row }) => {
      const { numberOfUnits, occupiedUnits } = row.original;
      if (numberOfUnits == null || occupiedUnits == null) return "—";
      return numberOfUnits - occupiedUnits;
    },
  },
  {
    accessorKey: "occupancy",
    header: "% Occupancy",
    cell: ({ row }) => {
      const value = row.original.occupancy;
      return value !== undefined ? `${value}%` : "—";
    },
  },
  {
    accessorKey: "expected",
    header: "Expected",
    cell: ({ row }) => {
      const value = row.original.expected;
      return value !== undefined ? formatUGX(value) : "—";
    },
  },
  {
    accessorKey: "outstanding",
    header: "Outstanding Balance",
    cell: ({ row }) => {
      const value = row.original.outstanding;
      return value !== undefined ? formatUGX(value) : "—";
    },
  },
  {
    id: "viewDetails",
    header: "Details",
    cell: ({ row }) => {
      const property = row.original
      return (
        <Link href={`/properties/${property.id}`}>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            View
          </div>
        </Link>
      )
    },
  },
]
