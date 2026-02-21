'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, DoorOpen } from 'lucide-react';
import { unitsApi, propertiesApi } from '@/lib/api';
import { Unit, Property } from '@/types';
import { AddUnitModal } from '@/components/units/AddUnitModal';
import { EditUnitModal } from '@/components/units/EditUnitModal';
import { getColumns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { useAuth } from '@/hooks/useAuth';

export default function UnitsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const { user } = useAuth();

  const { data: unitsData, isLoading: unitsLoading } = useQuery({
    queryKey: ['units', user?.id],
    queryFn: () => unitsApi.getAll(),
    enabled: !!user,
  });

  const { data: propertiesData } = useQuery({
    queryKey: ['properties', user?.id],
    queryFn: () => propertiesApi.getAll(),
    enabled: !!user,
  });

  const properties: Property[] = propertiesData?.data || [];

  const allUnits: Unit[] = unitsData?.data || [];
  const units = selectedPropertyId !== 'all'
    ? allUnits.filter((u) => u.propertyId === selectedPropertyId)
    : allUnits;

  const columns = getColumns();

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Units</h1>
            <p className="text-gray-600">Manage rental units across your properties</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Unit
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

        <Card>
          <CardContent>
            {unitsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading units...</p>
              </div>
            ) : units.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DoorOpen className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-4 font-semibold">No units found</p>
                <p className="text-sm text-gray-500">Get started by adding a new unit.</p>
                <Button className="mt-4" onClick={() => setIsAddModalOpen(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Unit
                </Button>
              </div>
            ) : (
                <DataTable columns={columns} data={units} searchKey="unitNumber" />
            )}
          </CardContent>
        </Card>
      </div>
      <AddUnitModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <EditUnitModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} unit={selectedUnit} />
    </>
  );
}