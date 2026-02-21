'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Building } from 'lucide-react';
import { propertiesApi } from '@/lib/api';
import { Property } from '@/types';
import { AddPropertyModal } from '@/components/properties/AddPropertyModal';
import { getColumns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { useAuth } from '@/hooks/useAuth';


export default function PropertiesPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { user } = useAuth();

  const { data: propertiesData, isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties', user?.id], // Include user ID to prevent cache sharing between users
    queryFn: () => propertiesApi.getAll(),
    enabled: !!user, // Only fetch when user is available
  });

  const properties: Property[] = propertiesData?.data || [];

  const columns = getColumns();

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
            <p className="text-gray-600">Manage your rental properties</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </div>

        <Card>
          <CardContent>
            {propertiesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading properties...</p>
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-4 font-semibold">No properties found</p>
                <p className="text-sm text-gray-500">Get started by adding a new property.</p>
                <Button className="mt-4" onClick={() => setIsAddModalOpen(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              </div>
            ) : (
              <DataTable columns={columns} data={properties} searchKey="name" />
            )}
          </CardContent>
        </Card>
      </div>
      <AddPropertyModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </>
  );
}