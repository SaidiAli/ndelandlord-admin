'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unitsApi, usersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Unit } from '@/types';
import { toast } from 'sonner';
import { Separator } from '../ui/separator';

const addTenantSchema = z.object({
  tenantData: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().min(1, 'Phone number is required'),
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
  unitId: z.string().uuid('Please select a unit'),
  leaseData: z.object({
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date" }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
    monthlyRent: z.coerce.number().positive('Monthly rent must be positive'),
    deposit: z.coerce.number().min(0, 'Deposit cannot be negative'),
  }),
});

type AddTenantFormData = z.infer<typeof addTenantSchema>;

interface AddTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddTenantModal({ isOpen, onClose }: AddTenantModalProps) {
  const queryClient = useQueryClient();

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

  const mutation = useMutation({
    mutationFn: (newTenantWithLease: AddTenantFormData) => usersApi.createWithLease(newTenantWithLease),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['available-units'] });
      toast.success('Tenant and lease created successfully!');
      handleClose();
    },
    onError: (error: any) => {
      console.error('Failed to create tenant:', error);
      toast.error(`Failed to create tenant: ${error.response?.data?.message || error.message}`);
    },
  });

  const onSubmit = (data: AddTenantFormData) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Tenant & Create Lease</DialogTitle>
          <DialogDescription>
            Create a new tenant account and assign them to an available unit with a new lease.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          <h4 className="font-semibold text-lg">Tenant Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" {...register('tenantData.firstName')} />
              {errors.tenantData?.firstName && <p className="text-sm text-red-500">{errors.tenantData.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" {...register('tenantData.lastName')} />
              {errors.tenantData?.lastName && <p className="text-sm text-red-500">{errors.tenantData.lastName.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register('tenantData.phone')} />
              {errors.tenantData?.phone && <p className="text-sm text-red-500">{errors.tenantData.phone.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input id="email" type="email" {...register('tenantData.email')} />
              {errors.tenantData?.email && <p className="text-sm text-red-500">{errors.tenantData.email.message}</p>}
            </div>
          </div>

          <h4 className="font-semibold text-lg mt-4">Account Credentials</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" {...register('tenantData.username')} />
                {errors.tenantData?.username && <p className="text-sm text-red-500">{errors.tenantData.username.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...register('tenantData.password')} />
                {errors.tenantData?.password && <p className="text-sm text-red-500">{errors.tenantData.password.message}</p>}
              </div>
          </div>
          
          <Separator className="my-6" />

          <h4 className="font-semibold text-lg">Lease & Unit Assignment</h4>
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
                      <SelectItem key={item.unit.id} value={item.unit.id}>
                        {item.property.name} - Unit {item.unit.unitNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.unitId && <p className="text-sm text-red-500">{errors.unitId.message}</p>}
          </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label htmlFor="startDate">Lease Start Date</Label>
              <Input id="startDate" type="date" {...register('leaseData.startDate')} />
              {errors.leaseData?.startDate && <p className="text-sm text-red-500">{errors.leaseData.startDate.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="endDate">Lease End Date</Label>
              <Input id="endDate" type="date" {...register('leaseData.endDate')} />
              {errors.leaseData?.endDate && <p className="text-sm text-red-500">{errors.leaseData.endDate.message}</p>}
            </div>
          </div>
          
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label htmlFor="monthlyRent">Monthly Rent (UGX)</Label>
              <Input id="monthlyRent" type="number" {...register('leaseData.monthlyRent')} />
              {errors.leaseData?.monthlyRent && <p className="text-sm text-red-500">{errors.leaseData.monthlyRent.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="deposit">Deposit (UGX)</Label>
              <Input id="deposit" type="number" {...register('leaseData.deposit')} />
              {errors.leaseData?.deposit && <p className="text-sm text-red-500">{errors.leaseData.deposit.message}</p>}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {isSubmitting || mutation.isPending ? 'Saving...' : 'Create Tenant & Lease'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}