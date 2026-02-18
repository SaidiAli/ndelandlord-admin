"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Unit } from "@/types"
import { capitalize } from "@/lib/unit-utils"
import Link from "next/link"

interface ColumnsProps {
  onViewDetails: (unitId: string) => void;
}

export const getColumns = ({ onViewDetails }: ColumnsProps): ColumnDef<Unit>[] => [
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
    accessorKey: "propertyType",
    header: "Type",
    cell: ({ row }) => {
      const propertyType = row.original.propertyType || row.original.property?.type;
      return (
        <Badge className={propertyType === 'commercial' ? 'bg-blue-500' : 'bg-green-500'}>
          {capitalize(propertyType || 'residential')}
        </Badge>
      );
    }
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
        <div
          className="cursor-pointer"
          onClick={() => onViewDetails(unit.id)}
        >
          <Eye className="h-4 w-4 mr-2" />
        </div>
      )
    },
  }
]
