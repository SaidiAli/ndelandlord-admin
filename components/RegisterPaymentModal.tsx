'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface RegisterPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    preSelectedLeaseId?: string;
}

interface Lease {
    id: string;
    unit: { unitNumber: string };
    property: { name: string };
    tenant: { firstName: string; lastName: string };
    monthlyRent: string;
}

export function RegisterPaymentModal({
    isOpen,
    onClose,
    onSuccess,
    preSelectedLeaseId,
}: RegisterPaymentModalProps) {
    // const { toast } = useToast();
    const [leases, setLeases] = useState<Lease[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [leaseId, setLeaseId] = useState(preSelectedLeaseId || '');
    const [amount, setAmount] = useState('');
    const [paidDate, setPaidDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [notes, setNotes] = useState('');

    // Fetch active leases on mount
    useEffect(() => {
        if (isOpen) {
            fetchLeases();
        }
    }, [isOpen]);

    const fetchLeases = async () => {
        setLoading(true);
        try {
            const response = await api.get('/leases?status=active'); // Assuming this endpoint exists
            if (response.data.success) {
                setLeases(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch leases:', error);
            // toast({
            //     title: 'Error',
            //     description: 'Failed to load leases',
            //     variant: 'destructive',
            // });
            alert('Failed to load leases');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log({ leaseId, amount, paidDate, paymentMethod, notes })
        if (!leaseId || !amount || !paidDate || !paymentMethod) {
            // toast({
            //     title: 'Error',
            //     description: 'Please fill in all required fields',
            //     variant: 'destructive',
            // });
            alert("Please fill in all required fields");
            return;
        }

        setSubmitting(true);
        try {
            const response = await api.post('/payments/register', {
                leaseId,
                amount,
                paidDate,
                paymentMethod,
                notes,
            });

            if (response.data.success) {
                // toast({
                //     title: 'Success',
                //     description: 'Payment registered successfully',
                // });
                alert("Payment registered successfully");
                onSuccess();
                onClose();
                resetForm();
            }
        } catch (error: any) {
            console.error('Failed to register payment:', error);
            // toast({
            //     title: 'Error',
            //     description: error.response?.data?.error || 'Failed to register payment',
            //     variant: 'destructive',
            // });
            alert(error.response?.data?.error || 'Failed to register payment');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setLeaseId(preSelectedLeaseId || '');
        setAmount('');
        setPaidDate(format(new Date(), 'yyyy-MM-dd'));
        setPaymentMethod('cash');
        setNotes('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Register Manual Payment</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {/* Lease Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="lease">Select Lease / Tenant</Label>
                        <Select
                            value={leaseId}
                            onValueChange={setLeaseId}
                            disabled={loading || !!preSelectedLeaseId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={loading ? 'Loading leases...' : 'Select a lease'} />
                            </SelectTrigger>
                            <SelectContent>
                                {leases.map((lease) => (
                                    <SelectItem key={lease.id} value={lease.id}>
                                        {lease.property.name} - Unit {lease.unit.unitNumber} ({lease.tenant.firstName} {lease.tenant.lastName})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (UGX)</Label>
                        <Input
                            id="amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            min="0"
                            required
                        />
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                        <Label htmlFor="date">Payment Date</Label>
                        <Input
                            id="date"
                            type="date"
                            value={paidDate}
                            onChange={(e) => setPaidDate(e.target.value)}
                            required
                        />
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                        <Label htmlFor="method">Payment Method</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                <SelectItem value="cheque">Cheque</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any additional details..."
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting || loading}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Register Payment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
