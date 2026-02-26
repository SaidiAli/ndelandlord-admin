'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { unitsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil, Building, DollarSign, Users, BedDouble, Bath, MapPin, Phone, Mail, Calendar, Home, Activity, CheckCircle, XCircle, Clock, BarChart3, Wifi, Layers, Maximize, Building2, Armchair, UsersRound } from 'lucide-react';
import { formatUGX } from '@/lib/currency';
import { EditUnitModal } from '@/components/units/EditUnitModal';
import { useAuth } from '@/hooks/useAuth';
import { UnitWithDetails, ResidentialUnitDetails, PropertyType } from '@/types';
import { isResidentialDetails } from '@/lib/unit-utils';

export default function UnitDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const unitId = params.id as string;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { user } = useAuth();

  const { data: unitData, isLoading: unitLoading } = useQuery({
    queryKey: ['unit-details', unitId, user?.id],
    queryFn: () => unitsApi.getDetails(unitId),
    enabled: !!unitId && !!user,
  });

  const unitDetails: UnitWithDetails = unitData?.data;
  const unit = unitDetails?.unit;
  const details = unitData?.data.details;
  const property = unitDetails?.property;
  const leaseHistory = unitDetails?.leaseHistory || [];
  const amenities = unitDetails?.amenities || [];

  console.log({ unitDetails })

  const propertyType: PropertyType = property?.type || unit?.propertyType || 'residential';

  if (unitLoading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-gray-500 mt-4">Loading unit details...</p>
      </div>
    );
  }

  if (!unit) {
    return <div className="text-center py-16 text-gray-500">Unit not found.</div>;
  }

  const transformedUnit = {
    id: unit.id,
    propertyId: property?.id || '',
    unitNumber: unit.unitNumber,
    propertyType: propertyType,
    squareFeet: unit.squareFeet,
    monthlyRent: parseFloat(unitDetails?.currentLease?.monthlyRent ?? '0'),
    deposit: parseFloat(unitDetails?.currentLease?.deposit ?? '0'),
    isAvailable: unit.isAvailable,
    description: unit.description,
    details: details,
    amenities: amenities,
    createdAt: unit.createdAt,
    updatedAt: unit.updatedAt,
  };

  // Render residential-specific metrics
  const renderResidentialMetrics = (details: ResidentialUnitDetails) => (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bedrooms</CardTitle>
          <BedDouble className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{details.bedrooms}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bathrooms</CardTitle>
          <Bath className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{details.bathrooms}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Furnished</CardTitle>
          <Armchair className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{details.isFurnished ? 'Yes' : 'No'}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balcony</CardTitle>
          <Layers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{details.hasBalcony ? 'Yes' : 'No'}</div>
        </CardContent>
      </Card>
    </>
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header with breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center cursor-pointer" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-gray-900">Unit {unit.unitNumber}</h1>
                <Badge className={unit.isAvailable ? "bg-secondary text-white" : ""}>
                  {unit.isAvailable ? (
                    <><CheckCircle className="h-3 w-3 mr-1" />Not Occupied</>
                  ) : (
                    <><XCircle className="h-3 w-3 mr-1" />Occupied</>
                  )}
                </Badge>
              </div>
              <div className="flex items-center text-gray-600 mt-1">
                <Building className="h-4 w-4 mr-1" />
                <span className="mr-2">{property?.name}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => setIsEditModalOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Unit
            </Button>
          </div>
        </div>

        {/* Financial Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Rent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatUGX(parseFloat(unitDetails?.currentLease?.monthlyRent ?? '0'))}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatUGX(unitDetails?.outstandingBalance ?? 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Advance Payments</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatUGX(unitDetails?.advancePayments ?? 0)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isResidentialDetails(details)
            ? renderResidentialMetrics(details)
            : <></>}
        </div>

        <div className="grid grid-cols-1 gap-6">

          {/* Unit Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Unit Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Unit Size</div>
                  <div className="text-sm font-medium text-foreground">{unit.squareFeet ? `${unit.squareFeet} sq ft` : 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Floor Number</div>
                  <div className="text-sm font-medium text-foreground">{details.floorNumber ? details.floorNumber : 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Description</div>
                  <div className="text-sm text-foreground">{unit.description ? unit.description : 'N/A'}</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Property</div>
                  <div className="text-sm font-mono text-foreground">{property?.name}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Status</div>
                  <div className="text-sm font-mono text-foreground">{unit.isAvailable ? 'Not Occupied' : 'Occupied'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Created</div>
                  <div className="text-sm text-foreground">{new Date(unit.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Amenities */}
        {amenities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Amenities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {amenities.map((amenity) => (
                  <Badge key={amenity.id}>
                    {amenity.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lease History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Lease History ({leaseHistory.length})
            </CardTitle>
            <CardDescription>
              Complete history of all leases for this unit
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leaseHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-4 font-semibold">No lease history</p>
                <p className="text-sm text-gray-500">This unit has no previous leases.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leaseHistory.map((leaseData, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">
                          {leaseData.tenant ? `${leaseData.tenant.firstName} ${leaseData.tenant.lastName}` : 'Unknown Tenant'}
                        </h4>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(leaseData.lease.startDate).toLocaleDateString()} -{' '}
                          {leaseData.lease.endDate ? new Date(leaseData.lease.endDate).toLocaleDateString() : 'Present'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Lease ID: {leaseData.lease.id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Property Context */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Property Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">{property?.name}</h3>
                <div className="flex items-center text-gray-600 mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {property?.address}, {property?.city} {property?.postalCode}
                </div>
              </div>
              <Button
                onClick={() => router.push(`/properties/${property?.id}`)}
              >
                View Property Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <EditUnitModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        unit={transformedUnit}
      />
    </>
  );
}
