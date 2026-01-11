"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, Edit } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TenantWithFullDetails } from "@/types"

interface ColumnsProps {
  onViewDetails: (tenantId: string) => void;
  onEdit: (tenantId: string) => void;
}

export const createColumns = ({ onViewDetails, onEdit }: ColumnsProps): ColumnDef<TenantWithFullDetails>[] => [
  {
    accessorKey: "tenant",
    header: ({ column }) => {
      return (
        <Button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
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
          <Badge className={mostRecentLease.lease.status === 'active' ? '' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}>
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
    accessorKey: "paymentStatus",
    header: "Payment Status",
    cell: ({ row }) => {
      const { paymentSummary } = row.original;
      const getStatusClassName = (status: string) => {
        switch (status) {
          case 'current': return '';
          case 'overdue': return 'bg-destructive text-destructive-foreground hover:bg-destructive/80';
          case 'advance': return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
          default: return 'bg-transparent border-input text-foreground';
        }
      };
      return <Badge className={getStatusClassName(paymentSummary.paymentStatus)}>{paymentSummary.paymentStatus}</Badge>
    }
  },
  {
    id: "viewDetails",
    header: "Details",
    cell: ({ row }) => {
      const { tenant } = row.original
      return (
        <Button
          onClick={() => onViewDetails(tenant.id)}
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
export const columns = createColumns({ onViewDetails: () => {}, onEdit: () => {} });