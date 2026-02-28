'use client';

import { useState } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { unitsApi, usersApi, leasesApi } from '@/lib/api';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Calendar } from '@/components/ui/Calendar';
import { toast } from 'sonner';
import { Separator } from '../ui/separator';
import { Icon } from '@iconify/react';

const addTenantSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().transform(val => val === '' ? undefined : val).pipe(z.string().email('Invalid email address').optional()),
  phone: z.string().min(1, 'Phone number is required'),
  userName: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  unitId: z.string().uuid('Please select a unit'),
  leaseData: z.object({
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date" }),
    endDate: z.string().optional(),
    monthlyRent: z.coerce.number().positive('Monthly rent must be positive'),
    deposit: z.coerce.number().min(0, 'Deposit cannot be negative'),
    securityDeposit: z.coerce.number().min(0).optional(),
  }),
});

type AddTenantFormData = z.infer<typeof addTenantSchema>;

interface AddTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddTenantModal({ isOpen, onClose }: AddTenantModalProps) {
  const queryClient = useQueryClient();
  const [activateImmediately, setActivateImmediately] = useState(true);

  const { data: unitsData, isLoading: unitsLoading } = useQuery({
    queryKey: ['available-units'],
    queryFn: () => unitsApi.getAvailable(),
  });
  const availableUnits: any[] = unitsData?.data || [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AddTenantFormData>({
    resolver: zodResolver(addTenantSchema),
  });
  const startDateValue = useWatch({ control, name: 'leaseData.startDate' });

  const mutation = useMutation({
    mutationFn: async (data: AddTenantFormData) => {
      const result = await usersApi.createWithLease(data);
      if (activateImmediately) {
        const leaseId = result?.data?.lease?.id;
        if (leaseId) {
          await leasesApi.activate(leaseId);
        }
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['available-units'] });
      toast.success(
        activateImmediately
          ? 'Tenant created and lease activated!'
          : 'Tenant and lease created successfully!'
      );
      handleClose();
    },
    onError: (error: any) => {
      console.error('Failed to create tenant:', error);
      toast.error(`Failed to create tenant: ${error.response?.data?.message || error.message}`);
    },
  });

  const onSubmit = (data: AddTenantFormData) => {
    const formattedData = {
      ...data,
      leaseData: {
        ...data.leaseData,
        startDate: new Date(data.leaseData.startDate).toISOString(),
        endDate: data.leaseData.endDate ? new Date(data.leaseData.endDate).toISOString() : undefined,
      }
    };
    mutation.mutate(formattedData);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Tenant</DialogTitle>
          <DialogDescription>
            Create a new tenant account and assign them to an available unit.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

            {/* Left column: Tenant Info + Account Credentials */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Tenant Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" {...register('firstName')} />
                  {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" {...register('lastName')} />
                  {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" {...register('phone')} />
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input id="email" type="email" {...register('email')} />
                  {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                </div>
              </div>

              <Separator className="my-2" />

              <h4 className="font-semibold text-lg">Account Credentials</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" {...register('userName')} />
                  {errors.userName && <p className="text-sm text-red-500">{errors.userName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" {...register('password')} />
                  {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                </div>
              </div>
            </div>

            {/* Right column: Unit Assignment */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Unit Assignment</h4>
              <div className="space-y-2">
                <Label htmlFor="unitId">Assign to Unit</Label>
                <Controller
                  name="unitId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={unitsLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an available unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUnits.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.property.name} - Unit {item.unitNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.unitId && <p className="text-sm text-red-500">{errors.unitId.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Controller
                    name="leaseData.startDate"
                    control={control}
                    render={({ field }) => {
                      const selected = field.value ? new Date(field.value) : undefined;
                      return (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button type="button" className="w-full justify-start text-left font-normal bg-transparent border-2 text-black">
                              <Icon icon="solar:calendar-broken" className="mr-2 h-4 w-4 text-black" />
                              {selected ? format(selected, 'PPP') : <span className="text-black">Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selected}
                              onSelect={(date) => field.onChange(date ? date.toISOString() : '')}
                            />
                          </PopoverContent>
                        </Popover>
                      );
                    }}
                  />
                  {errors.leaseData?.startDate && <p className="text-sm text-red-500">{errors.leaseData.startDate.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>End Date <span className="text-muted-foreground text-[10px]">(Optional)</span></Label>
                  <Controller
                    name="leaseData.endDate"
                    control={control}
                    render={({ field }) => {
                      const selected = field.value ? new Date(field.value) : undefined;
                      return (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button type="button" className="w-full justify-start text-left font-normal bg-transparent border-2 text-black">
                              <Icon icon="solar:calendar-broken" className="mr-2 h-4 w-4 text-black" />
                              {selected ? format(selected, 'PPP') : <span className="text-muted-foreground">Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selected}
                              onSelect={(date) => field.onChange(date ? date.toISOString() : undefined)}
                              disabled={(date) => {
                                if (!startDateValue) return false;
                                const startDate = new Date(startDateValue);
                                startDate.setHours(0, 0, 0, 0);
                                return date <= startDate;
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      );
                    }}
                  />
                  {errors.leaseData?.endDate && <p className="text-sm text-red-500">{errors.leaseData.endDate.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyRent">Monthly Rent</Label>
                  <Input id="monthlyRent" type="number" min={0} {...register('leaseData.monthlyRent')} />
                  {errors.leaseData?.monthlyRent && <p className="text-sm text-red-500">{errors.leaseData.monthlyRent.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit">Deposit</Label>
                  <Input id="deposit" type="number" min={0} {...register('leaseData.deposit')} />
                  {errors.leaseData?.deposit && <p className="text-sm text-red-500">{errors.leaseData.deposit.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="securityDeposit">
                    Security Deposit{' '}
                    <span className="text-muted-foreground text-[10px]">(Optional)</span>
                  </Label>
                  <Input id="securityDeposit" type="number" min={0} {...register('leaseData.securityDeposit')} />
                  {errors.leaseData?.securityDeposit && <p className="text-sm text-red-500">{errors.leaseData.securityDeposit.message}</p>}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label>Activate Immediately</Label>
                </div>
                <Switch
                  checked={activateImmediately}
                  onCheckedChange={setActivateImmediately}
                  disabled={mutation.isPending}
                />
              </div>
            </div>

          </div>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button className='bg-red-500' type="button">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {isSubmitting || mutation.isPending ? 'Saving...' : 'Create Tenant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}