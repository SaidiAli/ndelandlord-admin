'use client';

import { useQuery } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api';
import { Property } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, MapPin, Users, Home, CheckCircle, XCircle } from 'lucide-react';

interface PropertyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string | null;
}

export function PropertyDetailsModal({ isOpen, onClose, propertyId }: PropertyDetailsModalProps) {
  const { data: propertyResponse, isLoading, error } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => propertiesApi.getById(propertyId!),
    enabled: !!propertyId,
  });

  const property: Property = propertyResponse?.data;

  if (!isOpen || !propertyId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Property Details
          </DialogTitle>
          <DialogDescription>
            Comprehensive information about the selected property
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading property details...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>Failed to load property details</p>
          </div>
        ) : property ? (
          <div className="space-y-6">
            {/* Property Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  {property.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {property.address}, {property.city}, {property.state} {property.zipCode}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {property.description && (
                  <p className="text-gray-600">{property.description}</p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {property.units?.length || 0}
                    </div>
                    <div className="text-sm text-gray-500">Total Units</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {property.units?.filter(unit => !unit.isAvailable).length || 0}
                    </div>
                    <div className="text-sm text-gray-500">Occupied</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {property.units?.filter(unit => unit.isAvailable).length || 0}
                    </div>
                    <div className="text-sm text-gray-500">Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {property.units?.reduce((sum, unit) => sum + unit.monthlyRent, 0).toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-gray-500">Total Rent (UGX)</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Units Information */}
            {property.units && property.units.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Units ({property.units.length})
                  </CardTitle>
                  <CardDescription>
                    All units within this property
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {property.units.map((unit) => (
                      <div key={unit.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="font-semibold">{unit.unitNumber}</div>
                            <Badge variant={unit.isAvailable ? "secondary" : "default"}>
                              {unit.isAvailable ? (
                                <><CheckCircle className="h-3 w-3 mr-1" />Available</>
                              ) : (
                                <><XCircle className="h-3 w-3 mr-1" />Occupied</>
                              )}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">UGX {unit.monthlyRent.toLocaleString()}/month</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">{unit.bedrooms}</span> bedrooms
                          </div>
                          <div>
                            <span className="font-medium">{unit.bathrooms}</span> bathrooms
                          </div>
                          {unit.squareFeet && (
                            <div>
                              <span className="font-medium">{unit.squareFeet}</span> sq ft
                            </div>
                          )}
                        </div>
                        {unit.description && (
                          <p className="text-sm text-gray-500 mt-2">{unit.description}</p>
                        )}
                        {unit.currentTenant && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="h-3 w-3" />
                              <span className="font-medium">Current Tenant:</span>
                              {unit.currentTenant.firstName} {unit.currentTenant.lastName}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Property Owner Information */}
            {property.landlord && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Property Owner
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Name</div>
                      <div className="font-medium">
                        {property.landlord.firstName} {property.landlord.lastName}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <div className="font-medium">{property.landlord.email}</div>
                    </div>
                    {property.landlord.phone && (
                      <div>
                        <div className="text-sm text-gray-500">Phone</div>
                        <div className="font-medium">{property.landlord.phone}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm text-gray-500">Username</div>
                      <div className="font-medium">{property.landlord.userName}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Property Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Property Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Property ID</div>
                    <div className="font-mono">{property.id}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Created</div>
                    <div>{new Date(property.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Last Updated</div>
                    <div>{new Date(property.updatedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Property not found</p>
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}