'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { propertiesApi, exportsApi, downloadBlob } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, DollarSign, Users, BedDouble, Bath, Pencil, MapPin, Phone, Mail, Calendar, Home, TrendingUp, ArrowLeft, CheckCircle, XCircle, Building2, Plus, FileDown } from 'lucide-react';
import { formatUGX } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { EditPropertyModal } from '@/components/properties/EditPropertyModal';
import { AddUnitModal } from '@/components/units/AddUnitModal';
import { useAuth } from '@/hooks/useAuth';
import { PropertyDashboardData, ResidentialUnitDetails, CommercialUnitDetails } from '@/types';
import { isResidentialDetails, isCommercialDetails, capitalize } from '@/lib/unit-utils';
import { formatDateShort } from '@/lib/utils';

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const { user } = useAuth();

  const handleDownloadReport = async () => {
    setIsDownloadingReport(true);
    try {
      const blob = await exportsApi.downloadPropertyReport(propertyId);
      downloadBlob(blob, `property-report-${propertyId}.pdf`);
    } catch {
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setIsDownloadingReport(false);
    }
  };

  const { data: propertyData, isLoading: propertyLoading } = useQuery({
    queryKey: ['property-details', propertyId, user?.id],
    queryFn: () => propertiesApi.getById(propertyId),
    enabled: !!propertyId && !!user,
  });

  const propertyDetails: PropertyDashboardData = propertyData?.data;
  const property = propertyDetails?.property;
  const stats = propertyDetails?.stats;
  const recentActivity = propertyDetails?.recentActivity;
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
        {/* Header with breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="cursor-pointer flex items-center gap-2" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
              <div className="flex items-center text-gray-600 mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {property.address}, {property.city}, {property.postalCode}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsAddUnitModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </Button>
            <Button onClick={() => setIsEditModalOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Property
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadReport}
              disabled={isDownloadingReport}
            >
              {isDownloadingReport ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              Download Report
            </Button>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Units</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUnits || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupied Units</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.occupiedUnits || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Units</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.availableUnits || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatUGX(stats?.monthlyRevenue || 0)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Property Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Property Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {property.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900">{property.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Property address</label>
                  <p className="text-sm font-mono">{property.address}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">

                <div>
                  <label className="text-sm font-medium text-gray-500">Added on</label>
                  <p className="text-sm">{formatDateShort(property.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Managed by:</label>
                  <p className="text-sm font-mono"></p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">New Leases</span>
                <Badge>{recentActivity?.newLeases || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Expired Leases</span>
                <Badge>{recentActivity?.expiredLeases || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Maintenance Requests</span>
                <Badge>{recentActivity?.maintenanceRequests || 0}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Units Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Units in {property.name} ({units.length})
            </CardTitle>
            <CardDescription>
              Comprehensive overview of all units in this property.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {units.map((unitData) => (
                <div key={unitData.unit.id} className="border rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <a href={`/units/${unitData.unit.id}`}>
                        <h3 className="text-lg font-semibold">Unit {unitData.unit.unitNumber}</h3>
                      </a>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        {isResidentialDetails(unitData.unit.details) ? (
                          <>
                            <div className="flex items-center">
                              <BedDouble className="h-4 w-4 mr-1" />
                              {(unitData.unit.details as ResidentialUnitDetails).bedrooms} beds
                            </div>
                            <div className="flex items-center">
                              <Bath className="h-4 w-4 mr-1" />
                              {(unitData.unit.details as ResidentialUnitDetails).bathrooms} baths
                            </div>
                          </>
                        ) : isCommercialDetails(unitData.unit.details) ? (
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 mr-1" />
                            {capitalize((unitData.unit.details as CommercialUnitDetails).unitType)}
                            {(unitData.unit.details as CommercialUnitDetails).suiteNumber && ` - Suite ${(unitData.unit.details as CommercialUnitDetails).suiteNumber}`}
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Home className="h-4 w-4 mr-1" />
                            {capitalize(unitData.unit.propertyType || property.type || 'residential')} Unit
                          </div>
                        )}
                        {unitData.unit.squareFeet && (
                          <div>{unitData.unit.squareFeet} sq ft</div>
                        )}
                      </div>
                    </div>
                    <Badge className={unitData.unit.isAvailable ? "text-secondary-foreground bg-secondary/80" : ""}>
                      {unitData.unit.isAvailable ? (
                        <><CheckCircle className="h-3 w-3 mr-1" />Available</>
                      ) : (
                        <><XCircle className="h-3 w-3 mr-1" />Occupied</>
                      )}
                    </Badge>
                  </div>

                  {unitData.unit.description && (
                    <p className="text-sm text-gray-600 mb-4">{unitData.unit.description}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Monthly Rent</label>
                      <p className="font-semibold">{formatUGX(parseFloat(unitData.unit.monthlyRent))}</p>
                    </div>
                    {unitData.lease && (
                      <>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Lease Status</label>
                          <p className="font-semibold capitalize">{unitData.lease.status}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Lease Rent</label>
                          <p className="font-semibold">{formatUGX(parseFloat(unitData.lease.monthlyRent))}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {unitData.tenant && unitData.lease && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Current Tenant & Lease Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs font-medium text-gray-500">Tenant Name</label>
                            <p className="text-sm">{unitData.tenant.firstName} {unitData.tenant.lastName}</p>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            {unitData.tenant.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            {unitData.tenant.phone}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs font-medium text-gray-500">Lease Period</label>
                            <div className="flex items-center text-sm">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(unitData.lease.startDate).toLocaleDateString()} - {new Date(unitData.lease.endDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500">Lease ID</label>
                            <p className="text-sm font-mono">{unitData.lease.id}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <EditPropertyModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        property={{
          id: property.id,
          name: property.name,
          address: property.address,
          city: property.city,
          zipCode: property.postalCode || '',
          type: property.type,
          numberOfUnits: property.numberOfUnits,
          description: property.description,
          landlordId: property.landlordId,
          createdAt: property.createdAt,
          updatedAt: property.updatedAt,
          units: units.map(unitData => ({
            id: unitData.unit.id,
            propertyId: property.id,
            unitNumber: unitData.unit.unitNumber,
            propertyType: unitData.unit.propertyType,
            squareFeet: unitData.unit.squareFeet,
            monthlyRent: parseFloat(unitData.unit.monthlyRent),
            deposit: parseFloat(unitData.unit.deposit),
            isAvailable: unitData.unit.isAvailable,
            description: unitData.unit.description,
            details: unitData.unit.details,
            createdAt: property.createdAt,
            updatedAt: property.updatedAt,
            currentTenant: unitData.tenant ? {
              id: unitData.tenant.id,
              firstName: unitData.tenant.firstName,
              lastName: unitData.tenant.lastName,
              email: unitData.tenant.email,
              phone: unitData.tenant.phone
            } : undefined
          }))
        }}
      />
      <AddUnitModal
        isOpen={isAddUnitModalOpen}
        onClose={() => setIsAddUnitModalOpen(false)}
      />
    </>
  );
}