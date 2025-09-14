'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Building } from 'lucide-react';
import { propertiesApi } from '@/lib/api';
import { Property } from '@/types';

export default function PropertiesPage() {
  const { data: propertiesData, isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertiesApi.getAll(),
  });

  const properties: Property[] = propertiesData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600">Manage your rental properties</p>
        </div>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Properties</CardTitle>
          <CardDescription>A list of all your properties.</CardDescription>
        </CardHeader>
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
              <Button className="mt-4">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {properties.map((property) => (
                <div key={property.id} className="flex items-center justify-between py-4">
                  <div className="space-y-1">
                    <p className="font-medium">{property.name}</p>
                    <p className="text-sm text-gray-500">{property.address}, {property.city}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-500">{property.units?.length || 0} Units</p>
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