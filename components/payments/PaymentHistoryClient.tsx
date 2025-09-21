'use client';

import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api';
import { Payment } from '@/types';
import { DataTable } from '@/components/ui/data-table';
import { useAuth } from '@/hooks/useAuth';
import columns from '@/app/(dashboard)/payments/history/columns';

export function PaymentHistoryClient() {
  const { user } = useAuth();

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments-history', user?.id],
    queryFn: () => paymentsApi.getAll(),
    enabled: !!user,
  });

  const payments: Payment[] = paymentsData?.data || [];

  if (paymentsLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-gray-500 mt-2">Loading payment history...</p>
      </div>
    );
  }

  return <DataTable columns={columns} data={payments} searchKey="lease.tenant" />;
}