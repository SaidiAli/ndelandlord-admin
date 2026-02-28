'use client';

import { useQuery } from '@tanstack/react-query';
import { leasesApi, paymentsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Home, Phone, Mail, User, CreditCard, MapPin, FileText, Clock, Building2 } from 'lucide-react';
import { formatUGX } from '@/lib/currency';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentScheduleTab } from './PaymentScheduleTab';
import { ResidentialUnitDetails, CommercialUnitDetails } from '@/types';
import { isResidentialDetails, isCommercialDetails, capitalize } from '@/lib/unit-utils';

interface LeaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaseId: string | null;
}

export function LeaseDetailsModal({ isOpen, onClose, leaseId }: LeaseDetailsModalProps) {
  const { data: leaseDetailsData, isLoading: leaseLoading } = useQuery({
    queryKey: ['lease-details', leaseId],
    queryFn: () => leasesApi.getById(leaseId!),
    enabled: !!leaseId && isOpen,
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['lease-payments', leaseId],
    queryFn: () => paymentsApi.getByLease(leaseId!),
    enabled: !!leaseId && isOpen,
  });

  const leaseDetails = leaseDetailsData?.data;
  const payments = paymentsData?.data || [];
  const isLoading = leaseLoading || paymentsLoading;

  if (!isOpen || !leaseId) return null;

  const getStatusClassName = (status: string) => {
    switch (status) {
      case 'active': return '';
      case 'expired': return 'bg-destructive text-destructive-foreground hover:bg-destructive/80';
      case 'terminated': return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
      case 'draft': return 'bg-transparent border-input text-foreground';
      default: return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
    }
  };

  const calculateDuration = (startDate: string, endDate: string | null) => {
    if (!startDate) return '--';
    if (!endDate) return 'Open (Indefinite)';

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Invalid Date';

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.round(diffDays / 30.44);

    if (diffMonths >= 12) {
      const years = Math.floor(diffMonths / 12);
      const remainingMonths = diffMonths % 12;
      let durationText = years === 1 ? '1 year' : `${years} years`;
      if (remainingMonths > 0) {
        durationText += remainingMonths === 1 ? ' 1 month' : ` ${remainingMonths} months`;
      }
      return durationText;
    } else if (diffMonths >= 1) {
      return diffMonths === 1 ? '1 month' : `${diffMonths} months`;
    } else {
      return diffDays === 1 ? '1 day' : `${diffDays} days`;
    }
  };

  const calculateRemainingTime = (endDate: string | null) => {
    if (!endDate) return { text: 'No expiry', color: 'text-green-600' };

    const end = new Date(endDate);
    const now = new Date();

    if (isNaN(end.getTime())) return null;

    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'Expired', color: 'text-red-600' };
    } else if (diffDays === 0) {
      return { text: 'Expires today', color: 'text-red-600' };
    } else if (diffDays <= 30) {
      return { text: `${diffDays} days remaining`, color: 'text-orange-600' };
    } else {
      return { text: `${diffDays} days remaining`, color: 'text-green-600' };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lease Details</DialogTitle>
          <DialogDescription>
            Comprehensive information about the lease agreement, tenant, and property.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-gray-500">Loading lease details...</span>
          </div>
        ) : leaseDetails ? (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="payment-schedule">Payment Schedule</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6">
              {/* Lease Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Lease Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Lease ID</p>
                      <p className="font-medium font-mono text-sm">{leaseDetails.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <Badge className={getStatusClassName(leaseDetails.status)}>
                        {leaseDetails.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Monthly Rent</p>
                      <p className="font-medium text-lg">{formatUGX(leaseDetails.monthlyRent)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Deposit</p>
                      <p className="font-medium">{formatUGX(leaseDetails.deposit)}</p>
                    </div>
                    {leaseDetails.securityDeposit != null && (
                      <div>
                        <p className="text-sm text-gray-500">Security Deposit</p>
                        <p className="font-medium">{formatUGX(leaseDetails.securityDeposit)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Lease Duration</p>
                      <p className="font-medium">{calculateDuration(leaseDetails.startDate, leaseDetails.endDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Time Remaining</p>
                      {calculateRemainingTime(leaseDetails.endDate) && (
                        <p className={`font-medium ${calculateRemainingTime(leaseDetails.endDate)?.color}`}>
                          {calculateRemainingTime(leaseDetails.endDate)?.text}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lease Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Lease Period
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="font-medium">{new Date(leaseDetails.startDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">End Date</p>
                      <p className="font-medium">{leaseDetails.endDate ? new Date(leaseDetails.endDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Open (Indefinite)'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="font-medium">{new Date(leaseDetails.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="font-medium">{new Date(leaseDetails.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tenant Information */}
              {leaseDetails.tenant && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Tenant Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-medium">{leaseDetails.tenant.firstName} {leaseDetails.tenant.lastName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Username</p>
                        <p className="font-medium">{leaseDetails.tenant.userName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{leaseDetails.tenant.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{leaseDetails.tenant.phone || 'Not provided'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Account Status</p>
                        <Badge className={leaseDetails.tenant.isActive ? '' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}>
                          {leaseDetails.tenant.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Property & Unit Information */}
              {leaseDetails.unit && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      Property & Unit Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {leaseDetails.unit.property && (
                        <>
                          <div>
                            <h4 className="font-medium mb-2">Property Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-500" />
                                <div>
                                  <p className="text-sm text-gray-500">Property Name</p>
                                  <p className="font-medium">{leaseDetails.unit.property.name}</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Address</p>
                                <p className="font-medium">
                                  {leaseDetails.unit.property.address}, {leaseDetails.unit.property.city}
                                </p>
                              </div>
                            </div>
                          </div>
                          <Separator />
                        </>
                      )}

                      <div>
                        <h4 className="font-medium mb-2">Unit Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Unit Number</p>
                            <p className="font-medium">Unit {leaseDetails.unit.unitNumber}</p>
                          </div>
                          {isResidentialDetails(leaseDetails.unit.details) ? (
                            <>
                              <div>
                                <p className="text-sm text-gray-500">Bedrooms</p>
                                <p className="font-medium">{(leaseDetails.unit.details as ResidentialUnitDetails).bedrooms}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Bathrooms</p>
                                <p className="font-medium">{(leaseDetails.unit.details as ResidentialUnitDetails).bathrooms}</p>
                              </div>
                            </>
                          ) : isCommercialDetails(leaseDetails.unit.details) ? (
                            <>
                              <div>
                                <p className="text-sm text-gray-500">Unit Type</p>
                                <p className="font-medium">{capitalize((leaseDetails.unit.details as CommercialUnitDetails).unitType)}</p>
                              </div>
                              {(leaseDetails.unit.details as CommercialUnitDetails).suiteNumber && (
                                <div>
                                  <p className="text-sm text-gray-500">Suite Number</p>
                                  <p className="font-medium">{(leaseDetails.unit.details as CommercialUnitDetails).suiteNumber}</p>
                                </div>
                              )}
                            </>
                          ) : (
                            <div>
                              <p className="text-sm text-gray-500">Property Type</p>
                              <p className="font-medium">{capitalize(leaseDetails.unit.propertyType || 'residential')}</p>
                            </div>
                          )}
                          {leaseDetails.unit.squareFeet && (
                            <div>
                              <p className="text-sm text-gray-500">Square Feet</p>
                              <p className="font-medium">{leaseDetails.unit.squareFeet} sq ft</p>
                            </div>
                          )}
                          {leaseDetails.unit.description && (
                            <div className="md:col-span-2 lg:col-span-3">
                              <p className="text-sm text-gray-500">Description</p>
                              <p className="font-medium">{leaseDetails.unit.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lease Terms */}
              {leaseDetails.terms && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Lease Terms & Conditions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-md">
                      {leaseDetails.terms}
                    </div>
                  </CardContent>
                </Card>
              )}

            </TabsContent>
            <TabsContent value="payment-schedule">
              {leaseDetails && <PaymentScheduleTab lease={leaseDetails} payments={payments} />}
            </TabsContent>
            <div className="flex justify-end">
              <Button onClick={onClose}>Close</Button>
            </div>
          </Tabs>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Lease details not found.</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}