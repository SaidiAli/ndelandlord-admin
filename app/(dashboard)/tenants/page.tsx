'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, FileText, PlusCircle, Users } from 'lucide-react';
import { leasesApi, tenantsApi } from '@/lib/api';
import { AddTenantModal } from '@/components/tenants/AddTenantModal';
import { EditTenantModal } from '@/components/tenants/EditTenantModal';
import { createColumns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { Lease } from '@/types';
import { formatUGX } from '@/lib/currency';
import { useAuth } from '@/hooks/useAuth';

export default function TenantsPage() {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  const { data: tenantsData, isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants', user?.id],
    queryFn: () => tenantsApi.getAll(),
  });

  const { data: leasesData, isLoading: leasesLoading } = useQuery({
    queryKey: ['leases', user?.id],
    queryFn: () => leasesApi.getAll()
  });

  const leases: Lease[] = leasesData?.data || [];

  // Calculate lease statistics
  const leaseStats = {
    total: leases.length,
    active: leases.filter(l => l.status === 'active').length,
    draft: leases.filter(l => l.status === 'draft').length,
    expiring: leases.filter(l => l.status === 'expiring').length,
    expired: leases.filter(l => l.status === 'expired').length,
    totalBalance: leases.reduce((sum, l) => sum + (l.balance || 0), 0),
    totalRent: leases.filter(l => l.status === 'active').reduce((sum, l) => sum + l.monthlyRent, 0)
  };

  const tenants = tenantsData?.data || [];

  const handleEdit = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedTenantId(null);
  };

  const columns = createColumns({ onEdit: handleEdit });

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
            <p className="text-gray-600">Manage your tenants</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Tenant
          </Button>
        </div>

        {/* Lease Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leases</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leaseStats.total}</div>
              <p className="text-xs text-muted-foreground">
                {leaseStats.active} active, {leaseStats.draft} draft
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Leases</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{leaseStats.active}</div>
              <p className="text-xs text-muted-foreground">
                {formatUGX(leaseStats.totalRent)} monthly revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{leaseStats.expiring}</div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
              <AlertCircle className={`h-4 w-4 ${leaseStats.totalBalance > 0 ? 'text-red-600' : 'text-green-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${leaseStats.totalBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatUGX(leaseStats.totalBalance)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total owed across all leases
              </p>
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
                <Users className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-4 font-semibold">No tenants found</p>
                <p className="text-sm text-gray-500">Get started by adding a new tenant and creating a lease.</p>
                <Button className="mt-4" onClick={() => setIsAddModalOpen(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Tenant
                </Button>
              </div>
            ) : (
              <DataTable columns={columns} data={tenants} searchKey="tenant name" />
            )}
          </CardContent>
        </Card>
      </div>
      <AddTenantModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <EditTenantModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        tenantId={selectedTenantId}
      />
    </>
  );
}