'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatUGX, MOBILE_MONEY_PROVIDERS } from '@/lib/currency';
import { Payment } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { Icon } from '@iconify/react';

function getStatusBadgeClassName(status: string) {
    switch (status) {
        case 'completed': return '';
        case 'processing': return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
        case 'pending': return 'bg-transparent border-input text-foreground';
        case 'failed': return 'bg-destructive text-destructive-foreground hover:bg-destructive/80';
        default: return 'bg-transparent border-input text-foreground';
    }
}

function getProviderInfo(provider?: string) {
    if (!provider) return null;
    return MOBILE_MONEY_PROVIDERS[provider as keyof typeof MOBILE_MONEY_PROVIDERS];
}

export function getPaymentColumns(
    setSelectedPayment: (payment: Payment | null) => void,
): ColumnDef<Payment>[] {
    return [
        {
            id: 'unit',
            header: 'Unit / Tenant',
            cell: ({ row }) => {
                const payment = row.original;
                return (
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">
                                {payment.lease?.tenant?.firstName} {payment.lease?.tenant?.lastName} - {payment.lease?.unit?.unitNumber}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">
                            {payment.lease?.unit?.property?.name}
                        </p>
                    </div>
                );
            },
        },
        {
            accessorKey: 'transactionId',
            header: 'Transaction ID',
            cell: ({ row }) => (
                <span className="text-xs text-gray-400">{row.original.transactionId || row.original.id}</span>
            ),
        },
        {
            id: 'period',
            header: 'Period',
            cell: ({ row }) => {
                const periodCovered = (row.original as any).periodCovered;
                return periodCovered
                    ? <span className="text-xs text-gray-500">{periodCovered}</span>
                    : <span className="text-xs text-gray-300">—</span>;
            },
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => (
                <span className="font-medium">{formatUGX(row.original.amount)}</span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge className={getStatusBadgeClassName(row.original.status)}>
                    {row.original.status}
                </Badge>
            ),
        },
        {
            accessorKey: 'createdAt',
            header: 'Date',
            cell: ({ row }) => (
                <span className="text-xs text-gray-400">
                    {new Date(row.original.createdAt).toLocaleDateString()}
                </span>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <Button onClick={() => setSelectedPayment(row.original)}>
                    <Icon icon="solar:eye-bold-duotone" className="h-4 w-4" />
                </Button>
            ),
        },
    ];
}
