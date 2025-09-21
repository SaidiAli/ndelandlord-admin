import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentHistoryClient } from '@/components/payments/PaymentHistoryClient';

export default function PaymentHistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
        <p className="text-gray-600">A complete record of all payment transactions.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Payments</CardTitle>
          <CardDescription>A list of all payment transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentHistoryClient />
        </CardContent>
      </Card>
    </div>
  );
}