'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { propertiesApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, DollarSign, Users, BedDouble, Bath, Pencil } from 'lucide-react';
import { formatUGX } from '@/lib/currency';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { EditPropertyModal } from '@/components/properties/EditPropertyModal';

export default function PropertyDetailsPage() {
  const params = useParams();
  const propertyId = params.id as string;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: propertyData, isLoading: propertyLoading } = useQuery({
    queryKey: ['property-details', propertyId],
    queryFn: () => propertiesApi.getById(propertyId),
    enabled: !!propertyId,
  });

  const propertyDetails = propertyData?.data;
  const property = propertyDetails?.property;
  const stats = propertyDetails?.stats;
  const units = propertyDetails?.property?.units || [];

  if (propertyLoading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-gray-500 mt-4">Loading property details...</p>
      </div>
    );
  }

  if (!property) {
    return <div className="text-center py-16 text-gray-500">Property not found.</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
            <p className="text-gray-600">{property.address}, {property.city}</p>
          </div>
          <Button onClick={() => setIsEditModalOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Property
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Units</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUnits}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupied Units</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.occupiedUnits}</div>
              <p className="text-xs text-muted-foreground">{stats.occupancyRate}% occupancy</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatUGX(stats.monthlyRevenue)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Units List */}
        <Card>
          <CardHeader>
            <CardTitle>Units in {property.name}</CardTitle>
            <CardDescription>A list of all units in this property.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-200">
              {units.map((unit: any) => (
                <div key={unit.unit.id} className="py-4">
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-lg">Unit {unit.unit.unitNumber}</div>
                    <Badge variant={unit.unit.isAvailable ? "default" : "secondary"}>
                      {unit.unit.isAvailable ? "Available" : "Occupied"}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 mt-2 flex items-center space-x-4">
                    <div className="flex items-center"><BedDouble className="h-4 w-4 mr-1" /> {unit.unit.bedrooms} beds</div>
                    <div className="flex items-center"><Bath className="h-4 w-4 mr-1" /> {unit.unit.bathrooms} baths</div>
                    <div>{formatUGX(parseFloat(unit.unit.monthlyRent))}/mo</div>
                  </div>
                  {unit.tenant && (
                    <div className="mt-3">
                      <Separator />
                      <div className="pt-3">
                        <p className="text-sm font-semibold">Current Tenant</p>
                        <p className="text-sm">{unit.tenant.firstName} {unit.tenant.lastName}</p>
                        <p className="text-sm text-gray-500">{unit.tenant.email} | {unit.tenant.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <EditPropertyModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} property={property} />
    </>
  );
}