'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { leasesApi, paymentsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, CalendarDays, Home, Phone, Mail, User, MapPin, FileText, CheckCircle, AlertCircle, Settings, PlusCircle, Edit, CreditCard, Receipt, History, ExternalLink } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Payment, Lease } from '@/types';
import { formatUGX } from '@/lib/currency';
import { PaymentScheduleTab } from '@/components/leases/PaymentScheduleTab';
import { ResidentialUnitDetails, CommercialUnitDetails } from '@/types';
import { isResidentialDetails, isCommercialDetails, capitalize } from '@/lib/unit-utils';
import { CreateLeaseModal } from '@/components/leases/CreateLeaseModal';
import { useState } from 'react';
import { EditLeaseModal } from '@/components/leases/EditLeaseModal';

export default function TenantDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const leaseId = params.id as string;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: leaseDetailsData, isLoading } = useQuery({
    queryKey: ['lease-details', leaseId],
    queryFn: () => leasesApi.getById(leaseId),
    enabled: !!leaseId,
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['lease-payments', leaseId],
    queryFn: () => paymentsApi.getByLease(leaseId),
    enabled: !!leaseId,
  });

  const { data: leaseBalanceData } = useQuery({
    queryKey: ['lease-balance', leaseId],
    queryFn: () => leasesApi.getLeaseBalance(leaseId),
    enabled: !!leaseId,
  });

  const leaseDetails = leaseDetailsData?.data;
  const payments = paymentsData?.data || [];
  const leaseBalance = leaseBalanceData?.data;

  // Fetch all leases for this tenant to show lease history
  const { data: tenantLeasesData } = useQuery({
    queryKey: ['tenant-leases', leaseDetails?.tenantId],
    queryFn: () => leasesApi.getAll({ tenantId: leaseDetails!.tenantId }),
    enabled: !!leaseDetails?.tenantId,
  });

  const tenantLeases: Lease[] = tenantLeasesData?.data || [];
  const otherLeases = tenantLeases.filter(l => l.id !== leaseId);

  const getStatusClassName = (status: string) => {
    switch (status) {
      case 'active': return '';
      case 'expired': return 'bg-destructive text-destructive-foreground hover:bg-destructive/80';
      case 'terminated': return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
      case 'draft': return 'bg-transparent border-input text-foreground';
      case 'expiring': return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
      default: return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
    }
  };

  const calculateDuration = (startDate: string, endDate: string | null) => {
    if (!startDate) return '--';
    if (!endDate) return 'Open Contract';

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button className="bg-transparent text-foreground hover:bg-accent" onClick={() => router.push('/tenants')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-gray-500">Loading tenant details...</span>
        </div>
      </div>
    );
  }

  if (!leaseDetails) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button className="bg-transparent text-foreground hover:bg-accent" onClick={() => router.push('/tenants')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">Tenant details not found.</p>
          <Button onClick={() => router.push('/tenants')} className="mt-4">
            Return to Tenants page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button className="bg-transparent text-foreground hover:bg-accent" onClick={() => router.push('/tenants')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{leaseDetails.tenant?.firstName} {leaseDetails.tenant?.lastName}</h1>
          </div>
        </div>
      </div>

      {/* Status/Actions Bar */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <Badge className={`${getStatusClassName(leaseDetails.status)} mt-1`}>
              {leaseDetails.status}
            </Badge>
          </div>
          {leaseBalance && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Current Balance</h3>
              <p className={`text-lg font-bold ${leaseBalance.currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatUGX(leaseBalance.currentBalance)}
              </p>
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-gray-500">Payment Day</h3>
            <p className="text-lg font-bold">{leaseDetails.paymentDay}th of each month</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Lease
          </Button>
          {leaseDetails.status === 'draft' && (
            <Button
              onClick={() => null}
              disabled={true}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          )}
          {leaseDetails.status === 'draft' && (
            <Button
              onClick={() => null}
              disabled={true}
            >
              <Settings className="h-4 w-4 mr-2" />
              Activate
            </Button>
          )}
          {(leaseDetails.status === 'active' || leaseDetails.status === 'expiring') && (
            <Button
              onClick={() => null}
              disabled={true}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Terminate
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Payment Schedule</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="property">Property & Unit</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
                  <p className="text-sm text-gray-500">Monthly Rent</p>
                  <p className="font-medium text-lg">{formatUGX(leaseDetails.monthlyRent)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Security Deposit</p>
                  <p className="font-medium">{formatUGX(leaseDetails.deposit)}</p>
                </div>
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

          {/* Tenant Lease History */}
          {otherLeases.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Other Leases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {otherLeases.map((lease) => (
                    <div
                      key={lease.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">
                            {lease.unit?.property?.name || 'Property'} - Unit {lease.unit?.unitNumber || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(lease.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            {' - '}
                            {lease.endDate
                              ? new Date(lease.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                              : 'Present'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusClassName(lease.status)}>
                          {lease.status}
                        </Badge>
                        <p className="font-medium text-sm">{formatUGX(lease.monthlyRent)}/mo</p>
                        <Button
                          className="h-8 px-2 bg-transparent text-foreground hover:bg-accent"
                          onClick={() => router.push(`/tenants/${lease.id}`)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="schedule">
          <PaymentScheduleTab
            lease={leaseDetails}
            payments={payments}
          />
        </TabsContent>

        <TabsContent value="property" className="space-y-6">
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
                              {leaseDetails.unit.property.address}, {leaseDetails.unit.property.city}, {leaseDetails.unit.property.city}
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
                          {(leaseDetails.unit.details as ResidentialUnitDetails).isFurnished !== undefined && (
                            <div>
                              <p className="text-sm text-gray-500">Furnished</p>
                              <p className="font-medium">{(leaseDetails.unit.details as ResidentialUnitDetails).isFurnished ? 'Yes' : 'No'}</p>
                            </div>
                          )}
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
                          {(leaseDetails.unit.details as CommercialUnitDetails).maxOccupancy && (
                            <div>
                              <p className="text-sm text-gray-500">Max Occupancy</p>
                              <p className="font-medium">{(leaseDetails.unit.details as CommercialUnitDetails).maxOccupancy}</p>
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
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="mt-4 font-semibold text-gray-500">No payments recorded</p>
                  <p className="text-sm text-gray-400">Payments for this lease will appear here</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment: Payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {payment.paidDate
                            ? new Date(payment.paidDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : new Date(payment.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatUGX(payment.amount)}
                        </TableCell>
                        <TableCell>
                          {payment.mobileMoneyProvider ? (
                            <span className="capitalize">{payment.mobileMoneyProvider} Mobile Money</span>
                          ) : payment.paymentMethod ? (
                            <span className="capitalize">{payment.paymentMethod}</span>
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              payment.status === 'completed'
                                ? ''
                                : payment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                : payment.status === 'processing'
                                ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                                : payment.status === 'failed'
                                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/80'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-gray-500">
                          {payment.transactionId || '--'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateLeaseModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <EditLeaseModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} lease={leaseDetails} />
    </div>
  );
}
