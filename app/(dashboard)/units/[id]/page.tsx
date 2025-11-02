'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { unitsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Pencil,
  Building,
  DollarSign,
  Users,
  BedDouble,
  Bath,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Home,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { formatUGX } from '@/lib/currency';
import { EditUnitModal } from '@/components/units/EditUnitModal';
import { useAuth } from '@/hooks/useAuth';
import { UnitWithDetails } from '@/types';

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
  const property = unitDetails?.property;
  const currentLease = unitDetails?.currentLease;
  const currentTenant = unitDetails?.currentTenant;
  const leaseHistory = unitDetails?.leaseHistory || [];
  const analytics = unitDetails?.analytics;

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
    bedrooms: unit.bedrooms,
    bathrooms: parseFloat(unit.bathrooms),
    squareFeet: unit.squareFeet,
    monthlyRent: parseFloat(unit.monthlyRent),
    deposit: parseFloat(unit.deposit),
    isAvailable: unit.isAvailable,
    description: unit.description,
    createdAt: unit.createdAt,
    updatedAt: unit.updatedAt,
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header with breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Unit {unit.unitNumber}</h1>
              <div className="flex items-center text-gray-600 mt-1">
                <Building className="h-4 w-4 mr-1" />
                <span className="mr-2">{property?.name}</span>
                <MapPin className="h-4 w-4 mr-1" />
                {property?.address}, {property?.city}, {property?.state}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={unit.isAvailable ? "secondary" : "default"}>
              {unit.isAvailable ? (
                <><CheckCircle className="h-3 w-3 mr-1" />Available</>
              ) : (
                <><XCircle className="h-3 w-3 mr-1" />Occupied</>
              )}
            </Badge>
            <Button onClick={() => setIsEditModalOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Unit
            </Button>
          </div>
        </div>

        {/* Key Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Rent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatUGX(parseFloat(unit.monthlyRent))}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Deposit</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatUGX(parseFloat(unit.deposit))}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bedrooms</CardTitle>
              <BedDouble className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unit.bedrooms}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bathrooms</CardTitle>
              <Bath className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unit.bathrooms}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Unit Analytics */}
          {analytics && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Unit Performance Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{analytics.occupancyRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-500">Occupancy Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{formatUGX(analytics.totalRevenue)}</div>
                    <div className="text-sm text-gray-500">Total Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{analytics.averageLeaseLength}</div>
                    <div className="text-sm text-gray-500">Avg Lease (days)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unit Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Unit Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {unit.squareFeet && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Square Feet</label>
                  <p className="text-gray-900">{unit.squareFeet} sq ft</p>
                </div>
              )}
              {unit.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900">{unit.description}</p>
                </div>
              )}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Property</label>
                  <p className="text-sm font-mono">{property?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Unit ID</label>
                  <p className="text-sm font-mono">{unit.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-sm">{new Date(unit.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Lease and Tenant */}
        {currentLease && currentTenant && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Current Lease & Tenant
              </CardTitle>
              <CardDescription>Active lease and tenant information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tenant</label>
                    <p className="text-lg font-semibold">{currentTenant.firstName} {currentTenant.lastName}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {currentTenant.email}
                    </div>
                    {currentTenant.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {currentTenant.phone}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Lease Period</label>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(currentLease.startDate).toLocaleDateString()} - {new Date(currentLease.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="capitalize font-semibold">{currentLease.status}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Lease Rent</label>
                    <p className="text-lg font-bold">{formatUGX(parseFloat(currentLease.monthlyRent))}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Lease ID</label>
                    <p className="text-sm font-mono">{currentLease.id}</p>
                  </div>
                </div>
              </div>

              {currentLease.terms && (
                <div className="mt-6 pt-4 border-t">
                  <label className="text-sm font-medium text-gray-500">Lease Terms</label>
                  <p className="text-sm text-gray-700 mt-1">{currentLease.terms}</p>
                </div>
              )}
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
                  <div key={leaseData.lease.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{leaseData.tenant.firstName} {leaseData.tenant.lastName}</h4>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(leaseData.lease.startDate).toLocaleDateString()} - {new Date(leaseData.lease.endDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={leaseData.lease.status === 'active' ? 'default' : 'secondary'}>
                          {leaseData.lease.status}
                        </Badge>
                        <p className="text-sm font-semibold mt-1">{formatUGX(parseFloat(leaseData.lease.monthlyRent))}</p>
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
                  {property?.address}, {property?.city}, {property?.state} {property?.postalCode}
                </div>
              </div>
              <Button
                variant="outline"
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