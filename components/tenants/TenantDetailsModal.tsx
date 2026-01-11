'use client';

import { useQuery } from '@tanstack/react-query';
import { tenantsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Home, Phone, Mail, User, CreditCard, MapPin } from 'lucide-react';

interface TenantDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string | null;
}

export function TenantDetailsModal({ isOpen, onClose, tenantId }: TenantDetailsModalProps) {
  const { data: tenantDetailsData, isLoading } = useQuery({
    queryKey: ['tenant-details', tenantId],
    queryFn: () => tenantsApi.getTenantDetails(tenantId!),
    enabled: !!tenantId && isOpen,
  });

  const tenantDetails = tenantDetailsData?.data;

  if (!isOpen || !tenantId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tenant Details</DialogTitle>
          <DialogDescription>
            Comprehensive information about the tenant, their lease, and payment status.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-gray-500">Loading tenant details...</span>
          </div>
        ) : tenantDetails ? (
          <div className="space-y-6">
            {/* Tenant Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{tenantDetails.tenant.firstName} {tenantDetails.tenant.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Username</p>
                    <p className="font-medium">{tenantDetails.tenant.userName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{tenantDetails.tenant.email || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{tenantDetails.tenant.phone}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Account Status</p>
                    <Badge className={tenantDetails.tenant.isActive ? '' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}>
                      {tenantDetails.tenant.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="font-medium">{new Date(tenantDetails.tenant.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Lease Information */}
            {tenantDetails.leases && tenantDetails.leases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Current Lease Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tenantDetails.leases.map((leaseInfo: any, index: number) => (
                    <div key={index} className={index > 0 ? 'mt-6 pt-6 border-t' : ''}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Lease #{index + 1}</h4>
                        <Badge className={leaseInfo.lease.status === 'active' ? '' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}>
                          {leaseInfo.lease.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Property</p>
                          <p className="font-medium">{leaseInfo.property.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Unit Number</p>
                          <p className="font-medium">Unit {leaseInfo.unit.unitNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Monthly Rent</p>
                          <p className="font-medium">UGX {parseFloat(leaseInfo.lease.monthlyRent).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Lease Start</p>
                          <p className="font-medium">{new Date(leaseInfo.lease.startDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Lease End</p>
                          <p className="font-medium">{new Date(leaseInfo.lease.endDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <Badge className={leaseInfo.lease.status === 'active' ? '' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}>
                            {leaseInfo.lease.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Property Information */}
            {tenantDetails.leases && tenantDetails.leases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Property & Unit Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tenantDetails.leases.map((leaseInfo: any, index: number) => (
                    <div key={index} className={index > 0 ? 'mt-6 pt-6 border-t' : ''}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-500">Property Name</p>
                            <p className="font-medium">{leaseInfo.property.name}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Unit Details</p>
                          <p className="font-medium">Unit {leaseInfo.unit.unitNumber}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Payment Summary */}
            {tenantDetails.paymentSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Paid</p>
                      <p className="font-medium text-green-600">UGX {tenantDetails.paymentSummary.totalPaid.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Outstanding Balance</p>
                      <p className={`font-medium ${tenantDetails.paymentSummary.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        UGX {tenantDetails.paymentSummary.outstandingBalance.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Payment</p>
                      <p className="font-medium">
                        {tenantDetails.paymentSummary.lastPaymentDate 
                          ? new Date(tenantDetails.paymentSummary.lastPaymentDate).toLocaleDateString()
                          : 'No payments yet'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment Status</p>
                      <Badge 
                        variant={
                          tenantDetails.paymentSummary.paymentStatus === 'current' ? 'default' :
                          tenantDetails.paymentSummary.paymentStatus === 'overdue' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {tenantDetails.paymentSummary.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Tenant details not found.</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}