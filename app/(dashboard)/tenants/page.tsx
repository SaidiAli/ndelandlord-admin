'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users } from 'lucide-react';
import { tenantsApi } from '@/lib/api';
import { AddTenantModal } from '@/components/tenants/AddTenantModal';
import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';

export default function TenantsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { data: tenantsData, isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantsApi.getAll(),
  });

  const tenants = tenantsData?.data || [];

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
            <p className="text-gray-600">Manage your tenant relationships</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Tenant
          </Button>
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
              <DataTable columns={columns} data={tenants} searchKey="tenant" />
            )}
          </CardContent>
        </Card>
      </div>
      <AddTenantModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </>
  );
}