'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, FileText } from 'lucide-react';
import { leasesApi } from '@/lib/api';
import { Lease } from '@/types';
import { Badge } from '@/components/ui/badge';
import { formatUGX } from '@/lib/currency';

export default function LeasesPage() {
  const { data: leasesData, isLoading: leasesLoading } = useQuery({
    queryKey: ['leases'],
    queryFn: () => leasesApi.getAll(),
  });

  const leases: Lease[] = leasesData?.data || [];

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leases</h1>
          <p className="text-gray-600">Manage lease agreements for your properties</p>
        </div>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Lease
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Leases</CardTitle>
          <CardDescription>A list of all lease agreements.</CardDescription>
        </CardHeader>
        <CardContent>
          {leasesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading leases...</p>
            </div>
          ) : leases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-4 font-semibold">No leases found</p>
              <p className="text-sm text-gray-500">Get started by creating a new lease.</p>
              <Button className="mt-4">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Lease
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {leases.map((lease) => (
                <div key={lease.id} className="grid grid-cols-5 items-center py-4">
                  <div className="col-span-2 space-y-1">
                    <p className="font-medium">{lease.tenant?.firstName} {lease.tenant?.lastName}</p>
                    <p className="text-sm text-gray-500">{lease.unit?.property?.name} - Unit {lease.unit?.unitNumber}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>{new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>{formatUGX(lease.monthlyRent)}/mo</p>
                  </div>
                  <div className="flex items-center justify-end space-x-2">
                    <Badge variant={getStatusVariant(lease.status)}>
                      {lease.status}
                    </Badge>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}