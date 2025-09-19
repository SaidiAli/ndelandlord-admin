"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

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
import { TenantWithFullDetails } from "@/types"

export const columns: ColumnDef<TenantWithFullDetails>[] = [
  {
    accessorKey: "tenant",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
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
        return <Badge variant="outline">No leases</Badge>;
      }
      
      // Show status of most recent lease (first in array since backend orders by createdAt desc)
      const mostRecentLease = leases[0];
      const hasMultiple = leases.length > 1;
      
      return (
        <div className="space-y-1">
          <Badge variant={mostRecentLease.lease.status === 'active' ? 'default' : 'secondary'}>
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
      const getStatusVariant = (status: string) => {
        switch (status) {
          case 'current': return 'default';
          case 'overdue': return 'destructive';
          case 'advance': return 'secondary';
          default: return 'outline';
        }
      };
      return <Badge variant={getStatusVariant(paymentSummary.paymentStatus)}>{paymentSummary.paymentStatus}</Badge>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { tenant } = row.original
 
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
              onClick={() => navigator.clipboard.writeText(tenant.id)}
            >
              Copy tenant ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit tenant</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]