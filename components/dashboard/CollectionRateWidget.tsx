'use client';

import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api';
import { Payment } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function CollectionRateWidget() {
  const { user } = useAuth();
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['collection-rate', user?.id],
    queryFn: () => paymentsApi.getAll(),
    enabled: !!user,
  });

  const payments: Payment[] = paymentsData?.data || [];
  const completedPayments = payments.filter(p => p.status === 'completed');
  const collectionRate = payments.length > 0 ? (completedPayments.length / payments.length) * 100 : 100;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          <span>Collection Rate</span>
        </CardTitle>
        <CardDescription>
          Percentage of payments collected successfully.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{collectionRate.toFixed(2)}%</div>
        <Badge variant={collectionRate > 90 ? 'default' : 'secondary'}>
          {collectionRate > 90 ? 'Excellent' : 'Good'}
        </Badge>
      </CardContent>
    </Card>
  );
}