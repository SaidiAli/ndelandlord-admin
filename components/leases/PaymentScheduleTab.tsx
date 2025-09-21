'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatUGX } from '@/lib/currency';
import { PaymentSchedule, LeaseBalance } from '@/types';
import { Calendar, Clock, CheckCircle, AlertCircle, DollarSign, Info } from 'lucide-react';

interface PaymentScheduleTabProps {
  paymentSchedule: PaymentSchedule[];
  leaseBalance?: LeaseBalance;
  isLoading?: boolean;
}

export function PaymentScheduleTab({ paymentSchedule, leaseBalance, isLoading }: PaymentScheduleTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-sm text-gray-500">Loading payment schedule...</span>
      </div>
    );
  }

  const getPaymentStatusBadge = (schedule: PaymentSchedule) => {
    const dueDate = new Date(schedule.dueDate);
    const today = new Date();
    const isOverdue = dueDate < today && !schedule.isPaid;
    
    if (schedule.isPaid) {
      return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
    } else if (isOverdue) {
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>;
    } else {
      return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  // Helper function to check if payment is prorated
  const isProrated = (schedule: PaymentSchedule, scheduleList: PaymentSchedule[]) => {
    const isFirst = schedule.paymentNumber === 1;
    const isLast = schedule.paymentNumber === scheduleList.length;
    
    if (!isFirst && !isLast) return false;
    
    // Check if amount differs from typical monthly amount
    const typicalAmount = scheduleList.find(s => s.paymentNumber === 2)?.amount || schedule.amount;
    return Math.abs(schedule.amount - typicalAmount) > 0.01;
  };

  const getProrationNote = (schedule: PaymentSchedule, scheduleList: PaymentSchedule[]) => {
    if (!isProrated(schedule, scheduleList)) return null;
    
    if (schedule.paymentNumber === 1 && schedule.paymentNumber === scheduleList.length) {
      return 'Single month (prorated)';
    } else if (schedule.paymentNumber === 1) {
      return 'First month (prorated)';
    } else if (schedule.paymentNumber === scheduleList.length) {
      return 'Last month (prorated)';
    }
    return null;
  };

  const upcomingPayments = paymentSchedule.filter(p => !p.isPaid);
  const paidPayments = paymentSchedule.filter(p => p.isPaid);
  const overduePayments = paymentSchedule.filter(p => {
    const dueDate = new Date(p.dueDate);
    const today = new Date();
    return dueDate < today && !p.isPaid;
  });

  return (
    <div className="space-y-6">
      {/* Balance Summary */}
      {leaseBalance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Owed</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatUGX(leaseBalance.totalOwed)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatUGX(leaseBalance.totalPaid)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
              <AlertCircle className={`h-4 w-4 ${leaseBalance.currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${leaseBalance.currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatUGX(leaseBalance.currentBalance)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatUGX(leaseBalance.overdueAmount)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Payment Schedule
          </CardTitle>
          <CardDescription>
            Monthly payment schedule for this lease ({paymentSchedule.length} payments total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentSchedule.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-4 font-semibold">No payment schedule found</p>
              <p className="text-sm text-gray-500">Payment schedule will be generated when lease is activated.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{paidPayments.length}</div>
                  <div className="text-sm text-gray-600">Paid</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{overduePayments.length}</div>
                  <div className="text-sm text-gray-600">Overdue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{upcomingPayments.length - overduePayments.length}</div>
                  <div className="text-sm text-gray-600">Upcoming</div>
                </div>
              </div>

              {/* Payment List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {paymentSchedule.map((payment) => {
                  const prorated = isProrated(payment, paymentSchedule);
                  const prorationNote = getProrationNote(payment, paymentSchedule);
                  
                  return (
                    <div
                      key={payment.id}
                      className={`p-4 border rounded-lg ${
                        payment.isPaid ? 'bg-green-50 border-green-200' : 
                        new Date(payment.dueDate) < new Date() ? 'bg-red-50 border-red-200' : 
                        prorated ? 'bg-blue-50 border-blue-200' :
                        'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="font-semibold flex items-center gap-2">
                              Payment {payment.paymentNumber}
                              {prorated && (
                                <div className="flex items-center gap-1">
                                  <Info className="h-3 w-3 text-blue-600" />
                                  <span className="text-xs text-blue-600 font-medium">
                                    {prorationNote}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(payment.periodStart).toLocaleDateString()} - {new Date(payment.periodEnd).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="h-3 w-3" />
                              Due: {new Date(payment.dueDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className={`font-semibold ${prorated ? 'text-blue-600' : ''}`}>
                              {formatUGX(payment.amount)}
                            </div>
                          </div>
                          {getPaymentStatusBadge(payment)}
                        </div>
                      </div>
                      
                      {payment.paidPaymentId && (
                        <div className="mt-2 text-xs text-gray-500">
                          Payment ID: {payment.paidPaymentId}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Payment Due */}
      {leaseBalance?.nextPaymentDue && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Next Payment Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div>
                <div className="font-semibold">Payment {leaseBalance.nextPaymentDue.paymentNumber}</div>
                <div className="text-sm text-gray-600">
                  Due: {new Date(leaseBalance.nextPaymentDue.dueDate).toLocaleDateString()}
                </div>
                <div className="text-xs text-gray-500">
                  Period: {new Date(leaseBalance.nextPaymentDue.periodStart).toLocaleDateString()} - {new Date(leaseBalance.nextPaymentDue.periodEnd).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-600">
                  {formatUGX(leaseBalance.nextPaymentDue.amount)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}