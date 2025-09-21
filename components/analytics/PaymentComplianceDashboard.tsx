'use client';

import { useQuery } from '@tanstack/react-query';
import { leasesApi } from '@/lib/api';
import { Lease } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';

export function PaymentComplianceDashboard() {
  const { user } = useAuth();
  const { data: leasesData, isLoading } = useQuery({
    queryKey: ['leases-compliance', user?.id],
    queryFn: () => leasesApi.getAll(),
    enabled: !!user,
  });

  const leases: Lease[] = leasesData?.data || [];

  const getComplianceStatus = (lease: Lease) => {
    const totalPayments = lease.payments?.length || 0;
    const completedPayments = lease.payments?.filter(p => p.status === 'completed').length || 0;
    const compliance = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 100;

    let status: "on-track" | "at-risk" | "off-track" = "on-track";
    if (compliance < 90) {
        status = "at-risk";
    }
    if (compliance < 70) {
        status = "off-track";
    }

    return { compliance, status };
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Schedule Compliance</CardTitle>
        <CardDescription>
          An overview of tenant payment compliance with their lease schedules.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Compliance</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leases.map(lease => {
              const { compliance, status } = getComplianceStatus(lease);
              return (
                <TableRow key={lease.id}>
                  <TableCell>
                    {lease.tenant?.firstName} {lease.tenant?.lastName}
                  </TableCell>
                  <TableCell>
                    {lease.unit?.property?.name} - Unit {lease.unit?.unitNumber}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Progress value={compliance} className="w-24" />
                      <span>{compliance.toFixed(0)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={status === "on-track" ? "default" : status === "at-risk" ? "secondary" : "destructive"}>
                      {status}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}