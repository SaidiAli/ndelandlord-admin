'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api, { leasesApi, propertiesApi } from '@/lib/api';
import type { Property } from '@/types';
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
    const [submitting, setSubmitting] = useState(false);
    const [selectedPropertyId, setSelectedPropertyId] = useState('');

    const { data: propertiesData, isLoading: propertiesLoading } = useQuery({
        queryKey: ['properties'],
        queryFn: () => propertiesApi.getAll(),
        enabled: isOpen,
    });
    const properties: Property[] = propertiesData?.data ?? [];

    const { data: leasesData, isLoading: leasesLoading } = useQuery({
        queryKey: ['active-leases', selectedPropertyId],
        queryFn: () => leasesApi.getAll({
            status: 'active',
            propertyId: selectedPropertyId || undefined,
        }),
        enabled: isOpen && (!!preSelectedLeaseId || !!selectedPropertyId),
    });

    const leases = (leasesData?.data ?? []) as unknown as Lease[];

    // Form State
    const [leaseId, setLeaseId] = useState(preSelectedLeaseId || '');
    const [amount, setAmount] = useState('');
    const [paidDate, setPaidDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [notes, setNotes] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!leaseId || !amount || !paidDate || !paymentMethod) {
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
                alert("Payment registered successfully");
                onSuccess();
                onClose();
                resetForm();
            }
        } catch (error: any) {
            console.error('Failed to register payment:', error);
            alert(error.response?.data?.error || 'Failed to register payment');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedPropertyId('');
        setLeaseId(preSelectedLeaseId || '');
        setAmount('');
        setPaidDate(format(new Date(), 'yyyy-MM-dd'));
        setPaymentMethod('cash');
        setNotes('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Record New Payment</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 py-4">
                    {/* Row 1: Property | Select Tenant */}
                    {!preSelectedLeaseId && (
                        <div className="space-y-2">
                            <Label>Property</Label>
                            <Select
                                value={selectedPropertyId}
                                onValueChange={(val) => {
                                    setSelectedPropertyId(val);
                                    setLeaseId('');
                                }}
                                disabled={propertiesLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={propertiesLoading ? 'Loading...' : 'Select property'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {properties.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className={`space-y-2 ${preSelectedLeaseId ? 'col-span-2' : ''}`}>
                        <Label htmlFor="lease">Select Tenant</Label>
                        <Select
                            value={leaseId}
                            onValueChange={setLeaseId}
                            disabled={leasesLoading || !!preSelectedLeaseId || (!preSelectedLeaseId && !selectedPropertyId)}
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={
                                        leasesLoading
                                            ? 'Loading...'
                                            : !selectedPropertyId && !preSelectedLeaseId
                                                ? 'Select a property first'
                                                : 'Select tenant'
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {leases.map((lease) => (
                                    <SelectItem key={lease.id} value={lease.id}>
                                        Unit {lease.unit?.unitNumber} ({lease.tenant?.firstName} {lease.tenant?.lastName})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Row 2: Amount | Payment Date */}
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

                    {/* Row 3: Payment Method | Notes */}
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

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any additional details..."
                            className="h-[38px] min-h-0 resize-none"
                        />
                    </div>

                    <DialogFooter className="col-span-2">
                        <Button type="button" className='bg-red-500' onClick={onClose} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting || propertiesLoading || leasesLoading}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Record Payment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
