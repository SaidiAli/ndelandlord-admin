'use client';

import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api';
import { Payment } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { formatUGX } from '@/lib/currency';
import { useAuth } from '@/hooks/useAuth';

export function OverduePaymentsWidget() {
  const { user } = useAuth();
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['overdue-payments', user?.id],
    queryFn: () => paymentsApi.getAll({ status: 'pending' }),
    enabled: !!user,
  });

  const overduePayments = (paymentsData?.data || []).filter(
    (p: Payment) => new Date(p.dueDate!) < new Date()
  );

  const totalOverdue = overduePayments.reduce((acc: any, p: any) => acc + p.amount, 0);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <span>Overdue Payments</span>
        </CardTitle>
        <CardDescription>
          {overduePayments.length} payments are currently overdue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatUGX(totalOverdue)}</div>
      </CardContent>
    </Card>
  );
}