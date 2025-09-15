'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, DoorOpen } from 'lucide-react';
import { unitsApi } from '@/lib/api';
import { Unit } from '@/types';
import { AddUnitModal } from '@/components/units/AddUnitModal';
import { EditUnitModal } from '@/components/units/EditUnitModal';
import { getColumns } from './columns';
import { DataTable } from '@/components/ui/data-table';

export default function UnitsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  const { data: unitsData, isLoading: unitsLoading } = useQuery({
    queryKey: ['units'],
    queryFn: () => unitsApi.getAll(),
  });

  const units: Unit[] = unitsData?.data || [];
  
  const handleEdit = (unit: Unit) => {
    setSelectedUnit(unit);
    setIsEditModalOpen(true);
  };

  const columns = getColumns(handleEdit);

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
        
        <Card>
          <CardHeader>
            <CardTitle>All Units</CardTitle>
            <CardDescription>A list of all rental units.</CardDescription>
          </CardHeader>
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