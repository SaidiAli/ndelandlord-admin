"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, Edit } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
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
          <div
            className="flex flex-row"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Duration
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        )
      },
      cell: ({ row }) => {
        const lease = row.original;

        // Validate dates before parsing
        if (!lease.startDate) {
          return <span className="text-gray-400">--</span>;
        }

        const startDate = new Date(lease.startDate);

        // Handle open leases
        if (!lease.endDate) {
          return (
            <div className="space-y-1">
              <div className="font-medium">Open (Indefinite)</div>
              <div className="text-xs text-gray-500">
                Started {startDate.toLocaleDateString()}
              </div>
            </div>
          );
        }

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
      accessorKey: "paymentDay",
      header: () => <div className="text-center">Payment Day</div>,
      cell: ({ row }) => {
        const paymentDay = row.original.paymentDay;
        return <div className="text-center">{paymentDay ? `${paymentDay}th` : '--'}</div>
      },
    },
    {
      accessorKey: "balance",
      header: () => <div className="text-right">Balance</div>,
      cell: ({ row }) => {
        const balance = row.original.balance;
        if (balance === undefined) return <div className="text-right text-gray-400">--</div>;

        return (
          <div className={`text-right font-medium ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatUGX(balance)}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const lease = row.original;
        const getStatusClassName = (status: string) => {
          switch (status) {
            case 'active':
              return '';
            case 'expired':
              return 'bg-destructive text-destructive-foreground hover:bg-destructive/80';
            case 'terminated':
              return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
            case 'draft':
              return 'bg-transparent border-input text-foreground';
            case 'expiring':
              return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
            default:
              return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
          }
        };
        return <Badge className={getStatusClassName(lease.status)}>{lease.status}</Badge>
      }
    },
    {
      id: "viewDetails",
      header: "Details",
      cell: ({ row }) => {
        const lease = row.original
        return (
          <Button
            onClick={() => onViewDetails?.(lease.id)}
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
        const lease = row.original
        return (
          <Button
            onClick={() => onEdit(lease)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )
      },
    },
  ]