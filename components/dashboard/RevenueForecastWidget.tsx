'use client';

import { useQuery } from '@tanstack/react-query';
import { leasesApi } from '@/lib/api';
import { Lease } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { formatUGX } from '@/lib/currency';
import { useAuth } from '@/hooks/useAuth';

export function RevenueForecastWidget() {
  const { user } = useAuth();
  const { data: leasesData, isLoading } = useQuery({
    queryKey: ['active-leases', user?.id],
    queryFn: () => leasesApi.getAll({ status: 'active' }),
    enabled: !!user,
  });

  const activeLeases: Lease[] = leasesData?.data || [];
  const monthlyForecast = activeLeases.reduce((acc, l) => acc + l.monthlyRent, 0);
  const annualForecast = monthlyForecast * 12;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          <span>Revenue Forecast</span>
        </CardTitle>
        <CardDescription>
          Based on {activeLeases.length} active leases.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatUGX(annualForecast)} / year</div>
        <p className="text-sm text-gray-500">{formatUGX(monthlyForecast)} / month</p>
      </CardContent>
    </Card>
  );
}