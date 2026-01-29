"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, Edit } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Unit, ResidentialUnitDetails, CommercialUnitDetails } from "@/types"
import { formatUGX } from "@/lib/currency"
import { isResidentialDetails, isCommercialDetails, capitalize, getUnitDisplaySummary } from "@/lib/unit-utils"

interface ColumnsProps {
  onViewDetails: (unitId: string) => void;
  onEdit: (unit: Unit) => void;
}

export const getColumns = ({ onViewDetails, onEdit }: ColumnsProps): ColumnDef<Unit>[] => [
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
    id: "unitDetails",
    header: "Details",
    cell: ({ row }) => {
      const unit = row.original;
      const details = unit.details;
      const propertyType = unit.propertyType || unit.property?.type;

      // Display type-specific info
      if (isResidentialDetails(details)) {
        return (
          <span className="text-sm">
            {details.bedrooms} bed / {details.bathrooms} bath
          </span>
        );
      }

      if (isCommercialDetails(details)) {
        return (
          <span className="text-sm">
            {capitalize(details.unitType)}
            {details.suiteNumber && ` - Suite ${details.suiteNumber}`}
          </span>
        );
      }

      // Fallback for legacy data or missing details
      return (
        <span className="text-sm text-muted-foreground">
          {propertyType === 'commercial' ? 'Commercial' : 'Residential'}
        </span>
      );
    }
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
