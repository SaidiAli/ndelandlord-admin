'use client';

import { Lease, Payment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatUGX } from '@/lib/currency';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PaymentScheduleTabProps {
  lease: Lease;
  payments: Payment[];
}

const calculateProratedAmount = (date: Date, monthlyRent: number, isEndDate: boolean = false) => {
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  if (isEndDate) {
    const daysUsed = date.getDate();
    return (daysUsed / daysInMonth) * monthlyRent;
  }
  const daysRemaining = daysInMonth - date.getDate() + 1;
  return (daysRemaining / daysInMonth) * monthlyRent;
};

export function PaymentScheduleTab({ lease, payments }: PaymentScheduleTabProps) {
  if (!lease) {
    return <div>Loading schedule...</div>;
  }

  const paymentSchedules: { month: string; amount: number; isProrated: boolean; status: string; payment?: Payment }[] = [];
  if (!lease.endDate) {
    return <div className="p-4">Lease end date is not set.</div>;
  }
  const startDate = new Date(lease.startDate);
  const endDate = new Date(lease.endDate);
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const isFirstMonth =
      currentDate.getFullYear() === startDate.getFullYear() &&
      currentDate.getMonth() === startDate.getMonth();
    const isLastMonth =
      currentDate.getFullYear() === endDate.getFullYear() &&
      currentDate.getMonth() === endDate.getMonth();

    let amount = lease.monthlyRent;
    let isProrated = false;

    if (isFirstMonth && startDate.getDate() !== 1) {
      amount = calculateProratedAmount(startDate, lease.monthlyRent);
      isProrated = true;
    }

    if (isLastMonth) {
        const daysInMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
        if (endDate.getDate() !== daysInMonth) {
            amount = calculateProratedAmount(endDate, lease.monthlyRent, true);
            isProrated = true;
        }
    }

    const paymentForMonth = payments.find(p => {
        const paymentDate = new Date(p.createdAt);
        return paymentDate.getFullYear() === currentDate.getFullYear() && paymentDate.getMonth() === currentDate.getMonth();
    });

    const status = paymentForMonth ? paymentForMonth.status : 'pending';

    paymentSchedules.push({
      month: currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
      amount,
      isProrated,
      status,
      payment: paymentForMonth,
    });

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
        case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />;
        case 'pending': return <Clock className="h-5 w-5 text-gray-600" />;
        case 'failed': return <XCircle className="h-5 w-5 text-red-600" />;
        default: return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentSchedules.map((schedule) => (
              <TableRow key={schedule.month}>
                <TableCell>
                  {schedule.month}
                  {schedule.isProrated && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="inline-block w-4 h-4 ml-2 text-gray-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>This amount is prorated.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                  )}
                </TableCell>
                <TableCell>
                    <div className="flex items-center space-x-2">
                        {getStatusIcon(schedule.status)}
                        <Badge variant={schedule.status === 'completed' ? 'default' : 'secondary'}>
                            {schedule.status}
                        </Badge>
                    </div>
                </TableCell>
                <TableCell>
                    {schedule.payment?.paidDate ? new Date(schedule.payment.paidDate).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell className="text-right">{formatUGX(schedule.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}