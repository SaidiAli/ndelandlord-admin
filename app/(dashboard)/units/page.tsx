'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, DoorOpen } from 'lucide-react';
import { unitsApi } from '@/lib/api';
import { Unit } from '@/types';
import { Badge } from '@/components/ui/badge';
import { formatUGX } from '@/lib/currency';

export default function UnitsPage() {
  const { data: unitsData, isLoading: unitsLoading } = useQuery({
    queryKey: ['units'],
    queryFn: () => unitsApi.getAll(),
  });

  const units: Unit[] = unitsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Units</h1>
          <p className="text-gray-600">Manage rental units across your properties</p>
        </div>
        <Button>
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
              <Button className="mt-4">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Unit
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {units.map((unit) => (
                <div key={unit.id} className="grid grid-cols-4 items-center py-4">
                  <div className="col-span-2 space-y-1">
                    <p className="font-medium">Unit {unit.unitNumber} - {unit.property?.name}</p>
                    <p className="text-sm text-gray-500">{unit.bedrooms} bed, {unit.bathrooms} bath</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>{formatUGX(unit.monthlyRent)}/mo</p>
                  </div>
                  <div className="flex items-center justify-end space-x-2">
                    <Badge variant={unit.isAvailable ? 'default' : 'secondary'}>
                      {unit.isAvailable ? 'Available' : 'Occupied'}
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