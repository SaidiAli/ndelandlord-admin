'use client';

import { useQuery } from '@tanstack/react-query';
import { leasesApi } from '@/lib/api';
import { Lease } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function LeasePerformanceWidget() {
  const { user } = useAuth();
  const { data: leasesData, isLoading } = useQuery({
    queryKey: ['leases-performance', user?.id],
    queryFn: () => leasesApi.getAll(),
    enabled: !!user,
  });

  const leases: Lease[] = leasesData?.data || [];
  const activeLeases = leases.filter(l => l.status === 'active');
  const expiringLeases = activeLeases.filter(l => l.endDate && new Date(l.endDate) < new Date(new Date().setDate(new Date().getDate() + 30)));

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Lease Performance</span>
        </CardTitle>
        <CardDescription>
          {activeLeases.length} active leases, {expiringLeases.length} expiring soon.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{activeLeases.length} Active Leases</div>
        <p className="text-sm text-gray-500">{expiringLeases.length} expiring in the next 30 days</p>
      </CardContent>
    </Card>
  );
}