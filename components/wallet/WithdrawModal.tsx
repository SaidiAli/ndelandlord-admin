'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { walletApi } from '@/lib/api';
import { formatUGX } from '@/lib/currency';
import { toast } from 'sonner';
import { Loader2, CheckCircle, AlertCircle, Smartphone, Building2 } from 'lucide-react';
import { WithdrawalRequest, MobileMoneyProvider, WithdrawalDestinationType } from '@/types';
import { cn } from '@/lib/utils';

const withdrawalSchema = z.object({
  amount: z.number().min(10000, 'Minimum withdrawal is UGX 10,000'),
  destinationType: z.enum(['mobile_money', 'bank_account']),
  provider: z.enum(['mtn', 'airtel']).optional(),
  phoneNumber: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
}).refine(
  (data) => {
    if (data.destinationType === 'mobile_money') {
      return data.provider && data.phoneNumber && /^[0-9]{10,12}$/.test(data.phoneNumber);
    }
    return true;
  },
  { message: 'Phone number must be 10-12 digits', path: ['phoneNumber'] }
).refine(
  (data) => {
    if (data.destinationType === 'mobile_money') {
      return !!data.provider;
    }
    return true;
  },
  { message: 'Please select a provider', path: ['provider'] }
);

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  onSuccess?: () => void;
}

type ModalState = 'form' | 'processing' | 'success' | 'error';

export function WithdrawModal({ open, onOpenChange, availableBalance, onSuccess }: WithdrawModalProps) {
  const [modalState, setModalState] = useState<ModalState>('form');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
    setValue,
  } = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 0,
      destinationType: 'mobile_money',
      provider: undefined,
      phoneNumber: '',
    },
  });

  const destinationType = watch('destinationType');

  const withdrawMutation = useMutation({
    mutationFn: (data: WithdrawalRequest) => walletApi.withdraw(data),
    onMutate: () => {
      setModalState('processing');
    },
    onSuccess: (response) => {
      if (response.success) {
        setModalState('success');
        toast.success('Withdrawal initiated successfully');
        onSuccess?.();
      } else {
        setErrorMessage(response.error || 'Withdrawal failed');
        setModalState('error');
      }
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'An error occurred');
      setModalState('error');
      toast.error('Withdrawal failed');
    },
  });

  const onSubmit = (data: WithdrawalFormData) => {
    if (data.amount > availableBalance) {
      toast.error('Amount exceeds available balance');
      return;
    }

    const request: WithdrawalRequest = {
      amount: data.amount,
      destinationType: data.destinationType as WithdrawalDestinationType,
      provider: data.provider as MobileMoneyProvider,
      phoneNumber: data.phoneNumber,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
    };

    withdrawMutation.mutate(request);
  };

  const handleClose = () => {
    setModalState('form');
    setErrorMessage('');
    reset();
    onOpenChange(false);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setValue('amount', value ? parseInt(value, 10) : 0);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
          <DialogDescription>
            Available balance: {formatUGX(availableBalance)}
          </DialogDescription>
        </DialogHeader>

        {modalState === 'form' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (UGX)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  UGX
                </span>
                <Input
                  id="amount"
                  type="text"
                  className="pl-12"
                  placeholder="0"
                  {...register('amount', { valueAsNumber: true })}
                  onChange={handleAmountChange}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Minimum: UGX 10,000 | Maximum: {formatUGX(availableBalance)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Destination</Label>
              <Controller
                name="destinationType"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => field.onChange('mobile_money')}
                      className={cn(
                        "flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors",
                        field.value === 'mobile_money'
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <Smartphone className="h-4 w-4" />
                      <span className="text-sm font-medium">Mobile Money</span>
                    </button>
                    <button
                      type="button"
                      disabled
                      className="flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-gray-200 text-gray-400 cursor-not-allowed"
                    >
                      <Building2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Bank (Soon)</span>
                    </button>
                  </div>
                )}
              />
            </div>

            {destinationType === 'mobile_money' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Controller
                    name="provider"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                          <SelectItem value="airtel">Airtel Money</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.provider && (
                    <p className="text-sm text-red-500">{errors.provider.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="0771234567"
                    {...register('phoneNumber')}
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-red-500">{errors.phoneNumber.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Enter the mobile money number to receive funds
                  </p>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={availableBalance < 10000}>
                Withdraw
              </Button>
            </div>
          </form>
        )}

        {modalState === 'processing' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Processing withdrawal...</p>
            <p className="text-sm text-muted-foreground">
              Please wait while we process your request
            </p>
          </div>
        )}

        {modalState === 'success' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
            <p className="text-lg font-medium">Withdrawal Initiated</p>
            <p className="text-sm text-muted-foreground text-center">
              Your withdrawal request has been submitted. You will receive the funds shortly.
            </p>
            <Button onClick={handleClose} className="mt-4">
              Done
            </Button>
          </div>
        )}

        {modalState === 'error' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <AlertCircle className="h-12 w-12 text-red-600" />
            <p className="text-lg font-medium">Withdrawal Failed</p>
            <p className="text-sm text-muted-foreground text-center">
              {errorMessage}
            </p>
            <div className="flex gap-2 mt-4">
              <Button
                className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button onClick={() => setModalState('form')}>
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
