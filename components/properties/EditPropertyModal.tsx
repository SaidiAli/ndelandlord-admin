'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api';
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
import { Property, propertyTypes } from '@/types';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
const editPropertySchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  type: z.enum(propertyTypes).optional(),
  numberOfUnits: z.number().int().positive().optional(),
  managerName: z.string().optional(),
  managerPhone: z.string().optional(),
  managerEmail: z
    .union([z.string().email(), z.literal('')])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
});

type EditPropertyFormData = z.infer<typeof editPropertySchema>;

interface EditPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
}

export function EditPropertyModal({ isOpen, onClose, property }: EditPropertyModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
  } = useForm<EditPropertyFormData>({
    resolver: zodResolver(editPropertySchema),
  });

  useEffect(() => {
    if (property) {
      reset(property);
    }
  }, [property, reset]);

  const mutation = useMutation({
    mutationFn: (updatedProperty: EditPropertyFormData) =>
      propertiesApi.update(property!.id, updatedProperty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['property-details', property?.id, user?.id] });
      toast.success('Property updated successfully!');
      handleClose();
    },
    onError: (error) => {
      console.error('Failed to update property:', error);
      toast.error('Failed to update property.');
    },
  });

  const onSubmit = (data: EditPropertyFormData) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Property</DialogTitle>
          <DialogDescription>
            Update the details of your property below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

            {/* Left column: Property Details */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Property Details</h4>
              <div className="space-y-2">
                <Label htmlFor="name">Property Name</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...register('address')} />
                {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...register('city')} />
                  {errors.city && <p className="text-sm text-red-500">{errors.city.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code <span className="text-gray-500 text-xs">(Optional)</span></Label>
                  <Input id="postalCode" {...register('postalCode')} />
                  {errors.postalCode && <p className="text-sm text-red-500">{errors.postalCode.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type Of Property <span className="text-gray-500 text-xs">(Optional)</span></Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="numberOfUnits">Number of Units <span className="text-gray-500 text-xs">(Optional)</span></Label>
                <Input id="numberOfUnits" {...register('numberOfUnits', { valueAsNumber: true })} type="number" />
                {errors.numberOfUnits && <p className="text-sm text-red-500">{errors.numberOfUnits.message}</p>}
              </div>
            </div>

            {/* Right column: Property Manager */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Property Manager <span className="text-gray-500 font-normal text-sm">(Optional)</span></h4>
              <div className="space-y-2">
                <Label htmlFor="managerName">Manager Name</Label>
                <Input id="managerName" {...register('managerName')} placeholder="e.g. John Doe" />
                {errors.managerName && <p className="text-sm text-red-500">{errors.managerName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="managerPhone">Manager Phone</Label>
                <Input id="managerPhone" {...register('managerPhone')} placeholder="e.g. 0771234567" />
                {errors.managerPhone && <p className="text-sm text-red-500">{errors.managerPhone.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="managerEmail">Manager Email</Label>
                <Input id="managerEmail" {...register('managerEmail')} type="email" placeholder="e.g. manager@example.com" />
                {errors.managerEmail && <p className="text-sm text-red-500">{errors.managerEmail.message}</p>}
              </div>
            </div>

          </div>
          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button className="bg-red-500" type="button">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}