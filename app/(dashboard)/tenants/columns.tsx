"use client"

import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TenantWithFullDetails } from "@/types"

interface ColumnsProps {
  onEdit: (tenantId: string) => void;
}

export const createColumns = ({ onEdit }: ColumnsProps): ColumnDef<TenantWithFullDetails>[] => [
  {
    accessorKey: "tenant",
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
      const tenant = row.original.tenant;
      return <div className="font-medium">{tenant.firstName} {tenant.lastName}</div>
    },
  },
  {
    accessorKey: "leases",
    header: "Properties & Units",
    cell: ({ row }) => {
        const { leases } = row.original;
        if (leases.length === 0) {
          return <span className="text-gray-500">No leases</span>;
        }
        if (leases.length === 1) {
          const { property, unit } = leases[0];
          return <span>{property.name} - Unit {unit.unitNumber}</span>;
        }
        return (
          <div className="space-y-1">
            {leases.slice(0, 2).map((leaseInfo, index) => (
              <div key={index} className="text-sm">
                {leaseInfo.property.name} - Unit {leaseInfo.unit.unitNumber}
              </div>
            ))}
            {leases.length > 2 && (
              <div className="text-xs text-gray-500">+{leases.length - 2} more</div>
            )}
          </div>
        );
    }
  },
  {
    accessorKey: "status",
    header: "Lease Status",
    cell: ({ row }) => {
      const { leases } = row.original;
      if (leases.length === 0) {
        return <Badge>No leases</Badge>;
      }
      
      // Show status of most recent lease (first in array since backend orders by createdAt desc)
      const mostRecentLease = leases[0];
      const hasMultiple = leases.length > 1;
      
      return (
        <div className="space-y-1">
          <Badge className={mostRecentLease.lease.status === 'active' ? '' : 'bg-secondary text-white'}>
            {mostRecentLease.lease.status}
          </Badge>
          {hasMultiple && (
            <div className="text-xs text-gray-500">+{leases.length - 1} more</div>
          )}
        </div>
      );
    }
  },
  {
    id: "viewDetails",
    header: "Details",
    cell: ({ row }) => {
      const { leases } = row.original;
      if (leases.length === 0) {
        return <Badge>No leases</Badge>;
      }

      // Show status of most recent lease (first in array since backend orders by createdAt desc)
      const leaseData = leases[0];
      return (
        <Link href={`/tenants/${leaseData.lease.id}`}>
          <Button>
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
        </Link>
      )
    },
  },
  {
    id: "edit",
    header: "Edit",
    cell: ({ row }) => {
      const { tenant } = row.original
      return (
        <Button
          onClick={() => onEdit(tenant.id)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      )
    },
  },
];

// For backward compatibility, export a default columns function
export const columns = createColumns({ onEdit: () => {} });