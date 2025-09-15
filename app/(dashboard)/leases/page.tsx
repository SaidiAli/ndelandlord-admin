'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText } from 'lucide-react';
import { leasesApi } from '@/lib/api';
import { Lease } from '@/types';
import { CreateLeaseModal } from '@/components/leases/CreateLeaseModal';
import { EditLeaseModal } from '@/components/leases/EditLeaseModal';
import { getColumns } from './columns';
import { DataTable } from '@/components/ui/data-table';

export default function LeasesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);

  const { data: leasesData, isLoading: leasesLoading } = useQuery({
    queryKey: ['leases'],
    queryFn: () => leasesApi.getAll(),
  });

  const leases: Lease[] = leasesData?.data || [];
  
  const handleEdit = (lease: Lease) => {
    setSelectedLease(lease);
    setIsEditModalOpen(true);
  };

  const columns = getColumns(handleEdit);

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leases</h1>
            <p className="text-gray-600">Manage lease agreements for your properties</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
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
                <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Lease
                </Button>
              </div>
            ) : (
                <DataTable columns={columns} data={leases} searchKey="tenant" />
            )}
          </CardContent>
        </Card>
      </div>
      <CreateLeaseModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <EditLeaseModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} lease={selectedLease} />
    </>
  );
}