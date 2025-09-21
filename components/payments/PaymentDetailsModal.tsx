'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  RefreshCw,
  CreditCard,
  User,
  Building,
  Phone,
  Calendar,
  Hash,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { paymentsApi } from '@/lib/api';
import { formatUGX, formatPhoneNumber, MOBILE_MONEY_PROVIDERS } from '@/lib/currency';
import { Payment, PaymentReceipt } from '@/types';

interface PaymentDetailsModalProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentDetailsModal({ payment, isOpen, onClose }: PaymentDetailsModalProps) {
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);

  const { data: receiptData, isLoading: receiptLoading } = useQuery({
    queryKey: ['payment-receipt', payment?.id],
    queryFn: () => paymentsApi.getReceipt(payment!.id),
    enabled: !!payment && payment.status === 'completed',
  });

  const refreshMutation = useMutation({
    mutationFn: () => paymentsApi.getStatus(payment!.id),
    onSuccess: () => {
      // In a real app, you'd update the parent component's data
      // For now, we'll just show success feedback
    },
  });

  if (!payment) return null;

  const receipt: PaymentReceipt | null = receiptData?.data || null;
  const providerInfo = payment.mobileMoneyProvider 
    ? MOBILE_MONEY_PROVIDERS[payment.mobileMoneyProvider]
    : null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
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
    if (!receipt) return;
    
    setIsDownloadingReceipt(true);
    try {
      // In a real implementation, you'd generate and download a PDF receipt
      const receiptContent = `
PAYMENT RECEIPT
Receipt #: ${receipt.receiptNumber}
Date: ${new Date(receipt.paidDate).toLocaleDateString()}

Tenant: ${receipt.tenant.name}
Property: ${receipt.property.name}
Address: ${receipt.property.address}
Unit: ${receipt.unit.unitNumber}

Amount Paid: ${formatUGX(receipt.amount)}
Payment Method: ${receipt.paymentMethod}
Transaction ID: ${receipt.transactionId}

Thank you for your payment!
NDI Landlord Property Management
      `.trim();

      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${receipt.receiptNumber}.txt`;
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

  const periodCovered = (payment as any).periodCovered;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment Details</span>
          </DialogTitle>
          <DialogDescription>
            Complete information about this payment transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refreshMutation.mutate()}
                    disabled={refreshMutation.isPending}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  {payment.status === 'completed' && receipt && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadReceipt}
                      disabled={isDownloadingReceipt}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Receipt
                    </Button>
                  )}
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
                    Paid on {new Date(payment.paidDate).toLocaleDateString()} at{' '}
                    {new Date(payment.paidDate).toLocaleTimeString()}
                  </div>
                )}
                {periodCovered && (
                    <div className="text-sm text-gray-500 mt-1">
                        Covers period: {periodCovered}
                    </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transaction Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Hash className="h-5 w-5" />
                <span>Transaction Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Transaction ID</label>
                  <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                    {payment.transactionId || payment.id}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment ID</label>
                  <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                    {payment.id}
                  </p>
                </div>
              </div>

              {providerInfo && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Provider</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge 
                      variant="outline"
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
                    <Phone className="h-4 w-4" />
                    <span>{formatPhoneNumber(payment.phoneNumber)}</span>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Created At</label>
                  <p className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(payment.createdAt).toLocaleString()}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
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
                <Building className="h-5 w-5" />
                <span>Property & Tenant Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2 flex items-center space-x-2">
                    <Building className="h-4 w-4" />
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

                <div>
                  <h4 className="font-medium mb-2 flex items-center space-x-2">
                    <User className="h-4 w-4" />
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
              </div>
            </CardContent>
          </Card>

          {/* Receipt Information */}
          {payment.status === 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="h-5 w-5" />
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
                      <span>{new Date(receipt.paidDate).toLocaleString()}</span>
                    </div>
                    <Separator />
                    <Button 
                      onClick={handleDownloadReceipt}
                      disabled={isDownloadingReceipt}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isDownloadingReceipt ? 'Downloading...' : 'Download Receipt'}
                    </Button>
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
      </DialogContent>
    </Dialog>
  );
}