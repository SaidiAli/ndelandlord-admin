'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unitsApi, amenitiesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Unit, Amenity } from '@/types';
import { toast } from 'sonner';

// Form interface for inputs
interface EditUnitFormInputs {
  unitNumber: string;
  bedrooms: string;
  bathrooms: string;
  squareFeet: string;
  isAvailable: boolean;
  description: string;
  amenityIds: string[];
}

// Schema for validation and transformation
const editUnitSchema = z.object({
  unitNumber: z.string().min(1, 'Unit number is required'),
  bedrooms: z.coerce.number().int().min(0, 'Bedrooms must be non-negative'),
  bathrooms: z.coerce.number().min(0, 'Bathrooms must be non-negative'),
  squareFeet: z.string().optional().transform(val => {
    if (!val || val.trim() === '') return undefined;
    const num = Number(val);
    if (isNaN(num) || num <= 0) throw new Error('Square feet must be a positive number');
    return Math.floor(num);
  }),
  isAvailable: z.boolean(),
  description: z.string().optional(),
  amenityIds: z.array(z.string()).optional(),
});

type EditUnitFormData = z.infer<typeof editUnitSchema>;

interface EditUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: Unit | null;
}

export function EditUnitModal({ isOpen, onClose, unit }: EditUnitModalProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<EditUnitFormInputs>({
    resolver: zodResolver(editUnitSchema),
    defaultValues: {
      amenityIds: [],
    }
  });

  // Fetch available amenities
  const { data: amenitiesData } = useQuery({
    queryKey: ['amenities'],
    queryFn: () => amenitiesApi.getAll(),
  });
  const amenities: Amenity[] = amenitiesData?.data || [];

  // Fetch full unit details to get assigned amenities
  const { data: unitDetailsResponse, isLoading: detailsLoading } = useQuery({
    queryKey: ['unit-details', unit?.id],
    queryFn: () => unitsApi.getDetails(unit!.id),
    enabled: !!unit?.id && isOpen,
  });

  useEffect(() => {
    if (unitDetailsResponse?.data && unit) {
      const details = unitDetailsResponse.data;
      const u = details.unit;

      console.log({ details, u })
      // Merge basic unit info with details (amenities)
      reset({
        unitNumber: u.unitNumber,
        bedrooms: u.bedrooms.toString(),
        bathrooms: u.bathrooms.toString(),
        squareFeet: u.squareFeet ? u.squareFeet?.toString() : '',
        isAvailable: u.isAvailable,
        description: u.description || '',
        amenityIds: details.amenities?.map((a: Amenity) => a.id) || [],
      });
    } else if (unit) {
      // Fallback to basic unit data while loading or if fails
      reset({
        unitNumber: unit.unitNumber,
        bedrooms: unit.bedrooms.toString(),
        bathrooms: unit.bathrooms.toString(),
        squareFeet: unit.squareFeet ? unit.squareFeet.toString() : '',
        isAvailable: unit.isAvailable,
        description: unit.description || '',
        amenityIds: [],
      });
    }
  }, [unit, unitDetailsResponse, reset]);


  const mutation = useMutation({
    mutationFn: (updatedUnit: EditUnitFormInputs) => {
      // Transform and validate the data
      const validatedData = editUnitSchema.parse(updatedUnit);
      return unitsApi.update(unit!.id, validatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['property-details', unit?.propertyId] });
      queryClient.invalidateQueries({ queryKey: ['unit-details', unit?.id] });
      toast.success('Unit updated successfully!');
      handleClose();
    },
    onError: (error) => {
      console.error('Failed to update unit:', error);
      toast.error('Failed to update unit.');
    },
  });

  const onSubmit = (data: EditUnitFormInputs) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Unit {unit?.unitNumber}</DialogTitle>
          <DialogDescription>
            Update the details for this unit.
          </DialogDescription>
        </DialogHeader>

        {detailsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unitNumber">Unit Number</Label>
              <Input id="unitNumber" {...register('unitNumber')} />
              {errors.unitNumber && <p className="text-sm text-red-500">{errors.unitNumber.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input id="bedrooms" type="number" {...register('bedrooms')} />
                {errors.bedrooms && <p className="text-sm text-red-500">{errors.bedrooms.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input id="bathrooms" type="number" step="0.5" {...register('bathrooms')} />
                {errors.bathrooms && <p className="text-sm text-red-500">{errors.bathrooms.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="squareFeet">Square Feet (Optional)</Label>
              <Input id="squareFeet" type="number" {...register('squareFeet')} />
              {errors.squareFeet && <p className="text-sm text-red-500">{errors.squareFeet.message}</p>}
            </div>

            <div className="flex items-center space-x-3">
              <Controller
                name="isAvailable"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="isAvailable"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="isAvailable" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Unit Available for Rent
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter unit description, amenities, or special features..."
                {...register('description')}
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 gap-2 border p-3 rounded-md max-h-40 overflow-y-auto">
                {amenities.length === 0 ? (
                  <p className="text-sm text-gray-500 col-span-2">No amenities available.</p>
                ) : (
                  <Controller
                    name="amenityIds"
                    control={control}
                    render={({ field }) => (
                      <>
                        {amenities.map((amenity) => (
                          <div key={amenity.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-amenity-${amenity.id}`}
                              checked={field.value?.includes(amenity.id)}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                if (checked) {
                                  field.onChange([...current, amenity.id]);
                                } else {
                                  field.onChange(current.filter((id) => id !== amenity.id));
                                }
                              }}
                            />
                            <Label htmlFor={`edit-amenity-${amenity.id}`} className="cursor-pointer">
                              {amenity.name}
                            </Label>
                          </div>
                        ))}
                      </>
                    )}
                  />
                )}
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}