'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Icon } from '@iconify/react';
import { paymentsApi } from '@/lib/api';
import { formatUGX, formatPhoneNumber, MOBILE_MONEY_PROVIDERS } from '@/lib/currency';
import { authStorage } from '@/lib/auth';
import { Payment, PaymentReceipt } from '@/types';
import { format } from 'date-fns';
import { formatDateLong, formatDateShort } from '@/lib/utils';

interface PaymentDetailsModalProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentDetailsModal({ payment, isOpen, onClose }: PaymentDetailsModalProps) {
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);

  console.log({ payment })

  const { data: receiptData, isLoading: receiptLoading } = useQuery({
    queryKey: ['payment-receipt', payment?.id],
    queryFn: () => paymentsApi.getReceipt(payment!.id),
    enabled: !!payment && payment.status === 'completed',
  });

  if (!payment) return null;

  const receipt: PaymentReceipt | null = receiptData?.data || null;
  const providerInfo = payment.mobileMoneyProvider
    ? MOBILE_MONEY_PROVIDERS[payment.mobileMoneyProvider]
    : null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Icon icon="solar:check-circle-linear" className="h-5 w-5 text-green-600" />;
      case 'processing':
        return <Icon icon="solar:clock-circle-linear" className="h-5 w-5 text-yellow-600" />;
      case 'pending':
        return <Icon icon="solar:clock-circle-linear" className="h-5 w-5 text-gray-600" />;
      case 'failed':
        return <Icon icon="solar:close-circle-linear" className="h-5 w-5 text-red-600" />;
      default:
        return <Icon icon="solar:danger-triangle-linear" className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-yellow-600';
      case 'pending': return 'text-gray-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleDownloadReceipt = async () => {
    if (!payment || payment.status !== 'completed') return;

    setIsDownloadingReceipt(true);
    try {
      const token = authStorage.getToken();
      const response = await fetch(
        `http://localhost:4000/api/exports/payments/${payment.id}/receipt.pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${receipt?.receiptNumber ?? payment.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download receipt:', error);
    } finally {
      setIsDownloadingReceipt(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Icon icon="solar:card-linear" className="h-5 w-5" />
            <span>Payment Details</span>
          </DialogTitle>
          <DialogDescription>
            Complete information about this payment transaction
          </DialogDescription>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-6 items-start">
          {/* Left column: Payment information */}
          <div className="space-y-4">
            {/* Payment Status Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(payment.status)}
                    <span className={`font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-3xl font-bold mb-2">
                    {formatUGX(payment.amount)}
                  </div>
                  {payment.paidDate && (
                    <div className="text-sm text-gray-500">
                      Paid on {format(new Date(payment.paidDate), "dd/MM/yyyy")}
                    </div>
                  )}
                  {payment.periodCovered && (
                    <div className="text-sm text-gray-500 mt-1">
                      Covers period: {payment.periodCovered}
                    </div>
                  )}
                  {payment.appliedSchedules && payment.appliedSchedules.length > 0 && (
                    <div className="text-sm text-gray-500 mt-1">
                      Applied to {payment.appliedSchedules.length} period{payment.appliedSchedules.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Transaction Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Icon icon="solar:hashtag-linear" className="h-5 w-5" />
                  <span>Transaction Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Transaction ID</label>
                  <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                    {payment.transactionId || payment.id}
                  </p>
                </div>

                {providerInfo && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Provider</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge
                        style={{
                          backgroundColor: providerInfo.color,
                          color: providerInfo.textColor
                        }}
                      >
                        {providerInfo.name}
                      </Badge>
                    </div>
                  </div>
                )}

                {payment.phoneNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone Number</label>
                    <p className="flex items-center space-x-2">
                      <Icon icon="solar:phone-linear" className="h-4 w-4" />
                      <span>{formatPhoneNumber(payment.phoneNumber)}</span>
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created At</label>
                    <p className="flex items-center space-x-2">
                      <Icon icon="solar:calendar-linear" className="h-4 w-4" />
                      <span>{new Date(payment.createdAt).toLocaleString()}</span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="flex items-center space-x-2">
                      <Icon icon="solar:calendar-linear" className="h-4 w-4" />
                      <span>{new Date(payment.updatedAt).toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property & Tenant Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Icon icon="solar:buildings-linear" className="h-5 w-5" />
                  <span>Property & Tenant Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center space-x-2">
                    <Icon icon="solar:buildings-linear" className="h-4 w-4" />
                    <span>Property Information</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Property:</span>
                      <span className="ml-2 font-medium">
                        {payment.lease?.unit?.property?.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Unit:</span>
                      <span className="ml-2 font-medium">
                        {payment.lease?.unit?.unitNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Address:</span>
                      <span className="ml-2">
                        {payment.lease?.unit?.property?.address}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2 flex items-center space-x-2">
                    <Icon icon="solar:user-linear" className="h-4 w-4" />
                    <span>Tenant Information</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <span className="ml-2 font-medium">
                        {payment.lease?.tenant?.firstName} {payment.lease?.tenant?.lastName}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2">
                        {payment.lease?.tenant?.email}
                      </span>
                    </div>
                    {payment.lease?.tenant?.phone && (
                      <div>
                        <span className="text-gray-500">Phone:</span>
                        <span className="ml-2">
                          {formatPhoneNumber(payment.lease.tenant.phone)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column: Payment distribution */}
          <div className="space-y-4">
            {/* Applied Schedules (Partial/Bulk Payments) */}
            {payment.appliedSchedules && payment.appliedSchedules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Distribution</CardTitle>
                  <CardDescription>
                    This payment was applied to the following period(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {payment.appliedSchedules.map((schedule, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">Payment #{schedule.paymentNumber}</div>
                          <div className="text-sm text-gray-500">{formatSchedulePeriod(schedule.period)}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatUGX(schedule.amountApplied)}</div>
                          <div className="text-sm text-gray-500">
                            of {formatUGX(schedule.scheduledAmount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Receipt Information */}
            {payment.status === 'completed' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Icon icon="solar:download-linear" className="h-5 w-5" />
                    <span>Receipt Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {receiptLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Loading receipt...</p>
                    </div>
                  ) : receipt ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Receipt Number:</span>
                        <span className="font-medium">{receipt.receiptNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Generated:</span>
                        <span>{formatDateLong(new Date(receipt.paidDate))}</span>
                      </div>
                      <Separator />
                      <div className='grid grid-cols-3 gap-2'>
                        <Button
                          onClick={handleDownloadReceipt}
                          disabled={isDownloadingReceipt}
                          className="w-full"
                        >
                          <Icon icon="solar:download-linear" className="h-4 w-4 mr-2" />
                          {isDownloadingReceipt ? 'Downloading...' : 'Download Receipt'}
                        </Button>
                        <Button className='w-full'><Icon icon="basil:envelope-outline" className="h-4 w-4 mr-2" />Share on Email</Button>
                        <Button className='w-full'><Icon icon="iconoir:whatsapp-solid" className="h-4 w-4 mr-2" />WhatsApp</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">Receipt not available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {payment.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{payment.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const formatSchedulePeriod = (period: string) => {
  const strArr = period.split('-');

  return `${formatDateShort(strArr[0])} - ${formatDateShort(strArr[1])}`
}