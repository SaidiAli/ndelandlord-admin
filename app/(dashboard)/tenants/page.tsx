'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { tenantsApi, propertiesApi } from '@/lib/api';
import { AddTenantModal } from '@/components/tenants/AddTenantModal';
import { createColumns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { Property } from '@/types';
import { formatUGX } from '@/lib/currency';
import { useAuth } from '@/hooks/useAuth';

export default function TenantsPage() {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');

  const { data: tenantsData, isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants', user?.id],
    queryFn: () => tenantsApi.getAll(),
  });

  const { data: propertiesData } = useQuery({
    queryKey: ['properties', user?.id],
    queryFn: () => propertiesApi.getAll(),
    enabled: !!user,
  });

  const properties: Property[] = propertiesData?.data || [];
  const allTenants = tenantsData?.data || [];

  const tenants = selectedPropertyId !== 'all'
    ? allTenants.filter((t: any) => t.leases.some((l: any) => l.property.id === selectedPropertyId))
    : allTenants;
  
  const paymentSummaries = tenants.map((l: any) => l.paymentSummary);

  const tenantStats = {
    total: tenants.length,
    totalActive: tenants.filter((t: any) => t.leases.some((l: any) => l.status === 'active')).length,
    collectionHealth: 'n/a',
    totalBalance: paymentSummaries.reduce((acc: any, ps: any) => acc + ps.outstandingBalance, 0),
  }

  const columns = createColumns();

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
            <p className="text-gray-600">Manage your tenants</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Icon icon="solar:add-circle-broken" className="h-4 w-4 mr-2" />
            Add Tenant
          </Button>
        </div>

        {properties.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 font-medium">Property</span>
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Lease Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Icon icon="solar:text-circle-broken" className="h-8 w-8 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenantStats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Active</CardTitle>
              <Icon icon="solar:verified-check-broken" className="h-8 w-8 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{tenantStats.totalActive}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collection Health</CardTitle>
              <Icon icon="solar:users-group-rounded-broken" className="h-8 w-8 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{tenantStats.collectionHealth}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Outstanding Balance</CardTitle>
              <Icon icon="solar:hand-money-linear" className={`h-8 w-8 ${tenantStats.totalBalance > 0 ? 'text-red-600' : 'text-green-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${tenantStats.totalBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatUGX(tenantStats.totalBalance)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent>
            {tenantsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading tenants...</p>
              </div>
            ) : tenants.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Icon icon="lucide:users" className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-4 font-semibold">No tenants found</p>
                <p className="text-sm text-gray-500">Get started by adding a new tenant and creating a lease.</p>
                <Button className="mt-4" onClick={() => setIsAddModalOpen(true)}>
                  <Icon icon="solar:add-circle-broken" className="h-4 w-4 mr-2" />
                  Add Tenant
                </Button>
              </div>
            ) : (
              <DataTable columns={columns} data={tenants} searchKey="tenant" />
            )}
          </CardContent>
        </Card>
      </div>
      <AddTenantModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </>
  );
}