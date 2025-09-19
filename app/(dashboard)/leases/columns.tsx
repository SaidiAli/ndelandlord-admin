"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import Link from "next/link"

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
import { Lease } from "@/types"
import { formatUGX } from "@/lib/currency"

export const getColumns = (
  onEdit: (lease: Lease) => void,
  onViewDetails?: (leaseId: string) => void
): ColumnDef<Lease>[] => [
  {
    accessorKey: "tenant",
    header: "Tenant",
    cell: ({ row }) => {
      const tenant = row.original.tenant
      return <span>{tenant?.firstName} {tenant?.lastName}</span>
    },
    filterFn: (row, id, value) => {
      const tenant = row.original.tenant;
      const fullName = `${tenant?.firstName} ${tenant?.lastName}`.toLowerCase();
      return fullName.includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "unit",
    header: "Unit",
    cell: ({ row }) => {
      const unit = row.original.unit
      return <span>{unit?.property?.name} - {unit?.unitNumber}</span>
    }
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Duration
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const lease = row.original;
      
      // Validate dates before parsing
      if (!lease.startDate || !lease.endDate) {
        return <span className="text-gray-400">--</span>;
      }
      
      const startDate = new Date(lease.startDate);
      const endDate = new Date(lease.endDate);
      
      // Check if dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return <span className="text-red-400">Invalid Date</span>;
      }
      
      // Calculate duration in months
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffMonths = Math.round(diffDays / 30.44); // Average days per month
      
      let durationText = "";
      if (diffMonths >= 12) {
        const years = Math.floor(diffMonths / 12);
        const remainingMonths = diffMonths % 12;
        durationText = years === 1 ? "1 year" : `${years} years`;
        if (remainingMonths > 0) {
          durationText += remainingMonths === 1 ? " 1 month" : ` ${remainingMonths} months`;
        }
      } else if (diffMonths >= 1) {
        durationText = diffMonths === 1 ? "1 month" : `${diffMonths} months`;
      } else {
        durationText = diffDays === 1 ? "1 day" : `${diffDays} days`;
      }
      
      return (
        <div className="space-y-1">
          <div className="font-medium">{durationText}</div>
          <div className="text-xs text-gray-500">
            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: "monthlyRent",
    header: () => <div className="text-right">Monthly Rent</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("monthlyRent"))
      return <div className="text-right font-medium">{formatUGX(amount)}</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const lease = row.original;
       const getStatusVariant = (status: string) => {
        switch (status) {
          case 'active':
            return 'default';
          case 'expired':
            return 'destructive';
          default:
            return 'secondary';
        }
      };
      return <Badge variant={getStatusVariant(lease.status)}>{lease.status}</Badge>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const lease = row.original
 
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
              onClick={() => navigator.clipboard.writeText(lease.id)}
            >
              Copy lease ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onViewDetails?.(lease.id)}>View details</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(lease)}>Edit lease</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]