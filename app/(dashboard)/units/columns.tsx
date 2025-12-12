"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"

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
import { Unit } from "@/types"
import { formatUGX } from "@/lib/currency"

// Add onEdit to the component props
export const getColumns = (onEdit: (unit: Unit) => void): ColumnDef<Unit>[] => [
  {
    accessorKey: "unitNumber",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
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
      return <Badge variant={isAvailable ? "default" : "secondary"}>{isAvailable ? "Available" : "Occupied"}</Badge>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const unit = row.original

      const ActionsCell = () => {
        const router = useRouter();

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
                onClick={() => navigator.clipboard.writeText(unit.id)}
              >
                Copy unit ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/units/${unit.id}`)}>
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(unit)}>Edit unit</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      };

      return <ActionsCell />;
    },
  },
]