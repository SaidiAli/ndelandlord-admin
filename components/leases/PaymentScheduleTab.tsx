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

export function PaymentScheduleTab({ lease, payments }: PaymentScheduleTabProps) {
  if (!lease) {
    return <div>Loading schedule...</div>;
  }

  const paymentSchedules: { month: string; amount: number; isProrated: boolean; status: string; payment?: Payment }[] = [];

  const getStatusIcon = (status: string) => {
    switch (status) {
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