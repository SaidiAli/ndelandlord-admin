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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Unit,
  Amenity,
  PropertyType,
  residentialUnitTypes,
  commercialUnitTypes,
  ResidentialUnitDetails,
  CommercialUnitDetails,
} from '@/types';
import { toast } from 'sonner';
import { capitalize } from '@/lib/unit-utils';

// Residential edit schema
const editResidentialSchema = z.object({
  unitNumber: z.string().min(1, 'Unit number is required'),
  unitType: z.enum(residentialUnitTypes),
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
  hasBalcony: z.boolean().optional(),
  floorNumber: z.string().optional().transform(val => {
    if (!val || val.trim() === '') return undefined;
    return parseInt(val);
  }),
  isFurnished: z.boolean().optional(),
});

// Commercial edit schema
const editCommercialSchema = z.object({
  unitNumber: z.string().min(1, 'Unit number is required'),
  unitType: z.enum(commercialUnitTypes),
  squareFeet: z.string().optional().transform(val => {
    if (!val || val.trim() === '') return undefined;
    const num = Number(val);
    if (isNaN(num) || num <= 0) throw new Error('Square feet must be a positive number');
    return Math.floor(num);
  }),
  isAvailable: z.boolean(),
  description: z.string().optional(),
  amenityIds: z.array(z.string()).optional(),
  floorNumber: z.string().optional(),
  suiteNumber: z.string().optional(),
  ceilingHeight: z.string().optional().transform(val => {
    if (!val || val.trim() === '') return undefined;
    return parseFloat(val);
  }),
  maxOccupancy: z.string().optional().transform(val => {
    if (!val || val.trim() === '') return undefined;
    return parseInt(val);
  }),
});

interface EditResidentialFormInputs {
  unitNumber: string;
  unitType: typeof residentialUnitTypes[number];
  bedrooms: string;
  bathrooms: string;
  squareFeet: string;
  isAvailable: boolean;
  description: string;
  amenityIds: string[];
  hasBalcony: boolean;
  floorNumber: string;
  isFurnished: boolean;
}

interface EditCommercialFormInputs {
  unitNumber: string;
  unitType: typeof commercialUnitTypes[number];
  squareFeet: string;
  isAvailable: boolean;
  description: string;
  amenityIds: string[];
  floorNumber: string;
  suiteNumber: string;
  ceilingHeight: string;
  maxOccupancy: string;
}

interface EditUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: Unit | null;
}

export function EditUnitModal({ isOpen, onClose, unit }: EditUnitModalProps) {
  const queryClient = useQueryClient();

  // Fetch full unit details to get assigned amenities and property type
  const { data: unitDetailsResponse, isLoading: detailsLoading } = useQuery({
    queryKey: ['unit-details', unit?.id],
    queryFn: () => unitsApi.getDetails(unit!.id),
    enabled: !!unit?.id && isOpen,
  });

  const unitDetails = unitDetailsResponse?.data;
  const propertyType: PropertyType = unitDetails?.property?.type || unitDetails?.unit?.propertyType;

  const handleClose = () => {
    onClose();
  };

  if (detailsLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Unit {unit?.unitNumber}</DialogTitle>
            <DialogDescription>Loading unit details...</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Unit {unit?.unitNumber}</DialogTitle>
          <DialogDescription>
            Update the details for this {propertyType} unit.
          </DialogDescription>
        </DialogHeader>

        {propertyType === 'commercial' ? (
          <EditCommercialForm
            unit={unit}
            unitDetails={unitDetails}
            onClose={handleClose}
          />
        ) : (
          <EditResidentialForm
            unit={unit}
            unitDetails={unitDetails}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface FormProps {
  unit: Unit | null;
  unitDetails: any;
  onClose: () => void;
}

function EditResidentialForm({ unit, unitDetails, onClose }: FormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditResidentialFormInputs>({
    resolver: zodResolver(editResidentialSchema),
    defaultValues: {
      amenityIds: [],
      hasBalcony: false,
      isFurnished: false,
    }
  });

  // Fetch amenities for residential properties
  const { data: amenitiesData } = useQuery({
    queryKey: ['amenities', 'residential'],
    queryFn: async () => {
      const [residential, common] = await Promise.all([
        amenitiesApi.getResidential(),
        amenitiesApi.getCommon(),
      ]);
      return {
        data: [...(residential?.data || []), ...(common?.data || [])],
      };
    },
  });
  const amenities: Amenity[] = amenitiesData?.data || [];

  useEffect(() => {
    if (unitDetails && unit) {
      const u = unitDetails.unit;
      const details = u.details as ResidentialUnitDetails | undefined;

      reset({
        unitNumber: u.unitNumber,
        unitType: details?.unitType || 'apartment',
        bedrooms: details?.bedrooms?.toString() || '0',
        bathrooms: details?.bathrooms?.toString() || '0',
        squareFeet: u.squareFeet ? u.squareFeet.toString() : '',
        isAvailable: u.isAvailable,
        description: u.description || '',
        amenityIds: unitDetails.amenities?.map((a: Amenity) => a.id) || [],
        hasBalcony: details?.hasBalcony || false,
        floorNumber: details?.floorNumber?.toString() || '',
        isFurnished: details?.isFurnished || false,
      });
    }
  }, [unit, unitDetails, reset]);

  const mutation = useMutation({
    mutationFn: (data: EditResidentialFormInputs) => {
      const validatedData = editResidentialSchema.parse(data);
      // Backend expects residentialDetails nested object
      const payload = {
        unitNumber: validatedData.unitNumber,
        squareFeet: validatedData.squareFeet,
        isAvailable: validatedData.isAvailable,
        description: validatedData.description,
        amenityIds: validatedData.amenityIds,
        residentialDetails: {
          unitType: validatedData.unitType,
          bedrooms: validatedData.bedrooms,
          bathrooms: validatedData.bathrooms,
          hasBalcony: validatedData.hasBalcony,
          floorNumber: validatedData.floorNumber,
          isFurnished: validatedData.isFurnished,
        },
      };
      return unitsApi.updateResidential(unit!.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['property-details', unit?.propertyId] });
      queryClient.invalidateQueries({ queryKey: ['unit-details', unit?.id] });
      toast.success('Unit updated successfully!');
      onClose();
    },
    onError: (error) => {
      console.error('Failed to update unit:', error);
      toast.error('Failed to update unit.');
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unitNumber">Unit Number</Label>
          <Input id="unitNumber" {...register('unitNumber')} />
          {errors.unitNumber && <p className="text-sm text-red-500">{errors.unitNumber.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="unitType">Unit Type</Label>
          <Controller
            name="unitType"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit type" />
                </SelectTrigger>
                <SelectContent>
                  {residentialUnitTypes.map((type) => (
                    <SelectItem key={type} value={type}>{capitalize(type)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.unitType && <p className="text-sm text-red-500">{errors.unitType.message}</p>}
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="squareFeet">Square Feet (Optional)</Label>
          <Input id="squareFeet" type="number" {...register('squareFeet')} />
          {errors.squareFeet && <p className="text-sm text-red-500">{errors.squareFeet.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="floorNumber">Floor Number (Optional)</Label>
          <Input id="floorNumber" type="number" {...register('floorNumber')} />
          {errors.floorNumber && <p className="text-sm text-red-500">{errors.floorNumber.message}</p>}
        </div>
      </div>

      <div className="flex items-center space-x-6">
        {/* <div className="flex items-center space-x-2">
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
          <Label htmlFor="isAvailable">Available for Rent</Label>
        </div> */}
        <div className="flex items-center space-x-2">
          <Controller
            name="isFurnished"
            control={control}
            render={({ field }) => (
              <Switch
                id="isFurnished"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="isFurnished">Furnished</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Controller
            name="hasBalcony"
            control={control}
            render={({ field }) => (
              <Switch
                id="hasBalcony"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="hasBalcony">Has Balcony</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          placeholder="Enter unit description..."
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
  );
}

function EditCommercialForm({ unit, unitDetails, onClose }: FormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditCommercialFormInputs>({
    resolver: zodResolver(editCommercialSchema),
    defaultValues: {
      amenityIds: [],
    }
  });

  // Fetch amenities for commercial properties
  const { data: amenitiesData } = useQuery({
    queryKey: ['amenities', 'commercial'],
    queryFn: async () => {
      const [commercial, common] = await Promise.all([
        amenitiesApi.getCommercial(),
        amenitiesApi.getCommon(),
      ]);
      return {
        data: [...(commercial?.data || []), ...(common?.data || [])],
      };
    },
  });
  const amenities: Amenity[] = amenitiesData?.data || [];

  useEffect(() => {
    if (unitDetails && unit) {
      const u = unitDetails.unit;
      const details = u.details as CommercialUnitDetails | undefined;

      reset({
        unitNumber: u.unitNumber,
        unitType: details?.unitType || 'office',
        squareFeet: u.squareFeet ? u.squareFeet.toString() : '',
        isAvailable: u.isAvailable,
        description: u.description || '',
        amenityIds: unitDetails.amenities?.map((a: Amenity) => a.id) || [],
        floorNumber: details?.floorNumber?.toString() || '',
        suiteNumber: details?.suiteNumber || '',
        ceilingHeight: details?.ceilingHeight?.toString() || '',
        maxOccupancy: details?.maxOccupancy?.toString() || '',
      });
    }
  }, [unit, unitDetails, reset]);

  const mutation = useMutation({
    mutationFn: (data: EditCommercialFormInputs) => {
      const validatedData = editCommercialSchema.parse(data);
      // Backend expects commercialDetails nested object
      const payload = {
        unitNumber: validatedData.unitNumber,
        squareFeet: validatedData.squareFeet,
        isAvailable: validatedData.isAvailable,
        description: validatedData.description,
        amenityIds: validatedData.amenityIds,
        commercialDetails: {
          unitType: validatedData.unitType,
          floorNumber: validatedData.floorNumber,
          suiteNumber: validatedData.suiteNumber,
          ceilingHeight: validatedData.ceilingHeight,
          maxOccupancy: validatedData.maxOccupancy,
        },
      };
      return unitsApi.updateCommercial(unit!.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['property-details', unit?.propertyId] });
      queryClient.invalidateQueries({ queryKey: ['unit-details', unit?.id] });
      toast.success('Unit updated successfully!');
      onClose();
    },
    onError: (error) => {
      console.error('Failed to update unit:', error);
      toast.error('Failed to update unit.');
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unitNumber">Unit Number</Label>
          <Input id="unitNumber" {...register('unitNumber')} />
          {errors.unitNumber && <p className="text-sm text-red-500">{errors.unitNumber.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="unitType">Unit Type</Label>
          <Controller
            name="unitType"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit type" />
                </SelectTrigger>
                <SelectContent>
                  {commercialUnitTypes.map((type) => (
                    <SelectItem key={type} value={type}>{capitalize(type)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.unitType && <p className="text-sm text-red-500">{errors.unitType.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="suiteNumber">Suite Number (Optional)</Label>
          <Input id="suiteNumber" {...register('suiteNumber')} />
          {errors.suiteNumber && <p className="text-sm text-red-500">{errors.suiteNumber.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="floorNumber">Floor Number (Optional)</Label>
          <Input id="floorNumber" {...register('floorNumber')} />
          {errors.floorNumber && <p className="text-sm text-red-500">{errors.floorNumber.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="squareFeet">Square Feet (Optional)</Label>
          <Input id="squareFeet" type="number" {...register('squareFeet')} />
          {errors.squareFeet && <p className="text-sm text-red-500">{errors.squareFeet.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="ceilingHeight">Ceiling Height (ft)</Label>
          <Input id="ceilingHeight" type="number" step="0.1" {...register('ceilingHeight')} />
          {errors.ceilingHeight && <p className="text-sm text-red-500">{errors.ceilingHeight.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxOccupancy">Max Occupancy</Label>
          <Input id="maxOccupancy" type="number" {...register('maxOccupancy')} />
          {errors.maxOccupancy && <p className="text-sm text-red-500">{errors.maxOccupancy.message}</p>}
        </div>
      </div>

      {/* <div className="flex items-center space-x-3">
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
        <Label htmlFor="isAvailable">Available for Rent</Label>
      </div> */}

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          placeholder="Enter unit description..."
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
                        id={`edit-comm-amenity-${amenity.id}`}
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
                      <Label htmlFor={`edit-comm-amenity-${amenity.id}`} className="cursor-pointer">
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
  );
}
