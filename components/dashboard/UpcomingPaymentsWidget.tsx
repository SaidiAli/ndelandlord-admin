'use client';

import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api';
import { Payment } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { formatUGX } from '@/lib/currency';
import { useAuth } from '@/hooks/useAuth';

export function UpcomingPaymentsWidget() {
  const { user } = useAuth();
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['upcoming-payments', user?.id],
    queryFn: () => paymentsApi.getAll({ status: 'pending' }),
    enabled: !!user,
  });

  const upcomingPayments = (paymentsData?.data || []).filter(
    (p: Payment) => new Date(p.dueDate!) > new Date()
  );

  const nextPayment = upcomingPayments[0];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Upcoming Payments</span>
        </CardTitle>
        <CardDescription>
          {upcomingPayments.length} payments are scheduled.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {nextPayment ? (
            <div>
                <div className="text-2xl font-bold">{formatUGX(nextPayment.amount)}</div>
                <p className="text-sm text-gray-500">
                    Due on {new Date(nextPayment.dueDate!).toLocaleDateString()}
                </p>
            </div>
        ) : (
            <p>No upcoming payments.</p>
        )}
      </CardContent>
    </Card>
  );
}