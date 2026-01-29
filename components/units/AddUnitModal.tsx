'use client';

import { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { propertiesApi, unitsApi, amenitiesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Property,
  Amenity,
  residentialUnitTypes,
  commercialUnitTypes
} from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Trash2 } from 'lucide-react';
import { capitalize } from '@/lib/unit-utils';

// Residential unit schema
const residentialUnitSchema = z.object({
  propertyId: z.string().uuid('Please select a property'),
  unitNumber: z.string().min(1, 'Unit number is required'),
  unitType: z.enum(residentialUnitTypes, { required_error: 'Unit type is required' }),
  bedrooms: z.coerce.number().int().min(0, 'Bedrooms must be non-negative'),
  bathrooms: z.coerce.number().min(0, 'Bathrooms must be non-negative'),
  squareFeet: z.coerce.number().int().positive('Square feet must be positive').optional().or(z.literal('')),
  description: z.string().optional(),
  amenityIds: z.array(z.string()).optional(),
  hasBalcony: z.boolean().optional(),
  floorNumber: z.coerce.number().int().optional().or(z.literal('')),
  isFurnished: z.boolean().optional(),
});

// Commercial unit schema
const commercialUnitSchema = z.object({
  propertyId: z.string().uuid('Please select a property'),
  unitNumber: z.string().min(1, 'Unit number is required'),
  unitType: z.enum(commercialUnitTypes, { required_error: 'Unit type is required' }),
  squareFeet: z.coerce.number().int().positive('Square feet must be positive').optional().or(z.literal('')),
  description: z.string().optional(),
  amenityIds: z.array(z.string()).optional(),
  floorNumber: z.coerce.number().int().optional().or(z.literal('')),
  suiteNumber: z.string().optional(),
  ceilingHeight: z.coerce.number().positive('Ceiling height must be positive').optional().or(z.literal('')),
  maxOccupancy: z.coerce.number().int().positive('Max occupancy must be positive').optional().or(z.literal('')),
});

// Bulk residential schema
const bulkResidentialSchema = z.object({
  propertyId: z.string().uuid('Please select a property'),
  units: z.array(z.object({
    unitNumber: z.string().min(1, 'Required'),
    unitType: z.enum(residentialUnitTypes),
    bedrooms: z.coerce.number().int().min(0, 'Min 0'),
    bathrooms: z.coerce.number().min(0, 'Min 0'),
    squareFeet: z.union([z.string().length(0), z.string().min(1)]).optional()
      .transform(e => e === "" || e === undefined ? undefined : Number(e))
      .pipe(z.number().int().positive('Positive').optional()),
  })).min(1, 'At least one unit is required'),
});

// Bulk commercial schema
const bulkCommercialSchema = z.object({
  propertyId: z.string().uuid('Please select a property'),
  units: z.array(z.object({
    unitNumber: z.string().min(1, 'Required'),
    unitType: z.enum(commercialUnitTypes),
    squareFeet: z.union([z.string().length(0), z.string().min(1)]).optional()
      .transform(e => e === "" || e === undefined ? undefined : Number(e))
      .pipe(z.number().int().positive('Positive').optional()),
    suiteNumber: z.string().optional(),
  })).min(1, 'At least one unit is required'),
});

type ResidentialUnitFormData = z.infer<typeof residentialUnitSchema>;
type CommercialUnitFormData = z.infer<typeof commercialUnitSchema>;
type BulkResidentialFormData = z.infer<typeof bulkResidentialSchema>;
type BulkCommercialFormData = z.infer<typeof bulkCommercialSchema>;

interface AddUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddUnitModal({ isOpen, onClose }: AddUnitModalProps) {
  const { user } = useAuth();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  const { data: propertiesData, isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties', user?.id],
    queryFn: () => propertiesApi.getAll(),
    enabled: !!user,
  });
  const properties: Property[] = propertiesData?.data || [];

  // Get the selected property to determine its type
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  const handleClose = () => {
    setSelectedPropertyId('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Unit</DialogTitle>
          <DialogDescription>
            Add a single unit or multiple units at once. The form fields will adjust based on the property type.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="single">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Unit</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Add</TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <div className="space-y-4 py-4">
              <PropertySelector
                properties={properties}
                loading={propertiesLoading}
                selectedPropertyId={selectedPropertyId}
                onPropertyChange={setSelectedPropertyId}
              />
              {selectedProperty && (
                selectedProperty.type === 'commercial' ? (
                  <CommercialUnitForm
                    onSuccess={handleClose}
                    userId={user?.id}
                    selectedPropertyId={selectedPropertyId}
                  />
                ) : (
                  <ResidentialUnitForm
                    onSuccess={handleClose}
                    userId={user?.id}
                    selectedPropertyId={selectedPropertyId}
                  />
                )
              )}
            </div>
          </TabsContent>

          <TabsContent value="bulk">
            <div className="space-y-4 py-4">
              <PropertySelector
                properties={properties}
                loading={propertiesLoading}
                selectedPropertyId={selectedPropertyId}
                onPropertyChange={setSelectedPropertyId}
              />
              {selectedProperty && (
                selectedProperty.type === 'commercial' ? (
                  <BulkCommercialForm
                    onSuccess={handleClose}
                    userId={user?.id}
                    selectedPropertyId={selectedPropertyId}
                  />
                ) : (
                  <BulkResidentialForm
                    onSuccess={handleClose}
                    userId={user?.id}
                    selectedPropertyId={selectedPropertyId}
                  />
                )
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface PropertySelectorProps {
  properties: Property[];
  loading: boolean;
  selectedPropertyId: string;
  onPropertyChange: (id: string) => void;
}

function PropertySelector({ properties, loading, selectedPropertyId, onPropertyChange }: PropertySelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="propertyId">Property</Label>
      <Select onValueChange={onPropertyChange} value={selectedPropertyId} disabled={loading}>
        <SelectTrigger>
          <SelectValue placeholder="Select a property" />
        </SelectTrigger>
        <SelectContent>
          {properties.map((prop) => (
            <SelectItem key={prop.id} value={prop.id}>
              {prop.name} <span className="text-muted-foreground">({prop.type})</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface FormProps {
  onSuccess: () => void;
  userId?: string;
  selectedPropertyId: string;
}

function ResidentialUnitForm({ onSuccess, userId, selectedPropertyId }: FormProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ResidentialUnitFormData>({
    resolver: zodResolver(residentialUnitSchema),
    defaultValues: {
      propertyId: selectedPropertyId,
      amenityIds: [],
      unitType: 'apartment',
      bedrooms: 1,
      bathrooms: 1,
      hasBalcony: false,
      isFurnished: false,
    }
  });

  // Fetch amenities for residential properties (residential + common)
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

  const mutation = useMutation({
    mutationFn: (data: ResidentialUnitFormData) => {
      // Backend expects residentialDetails nested object
      const payload = {
        propertyId: data.propertyId,
        unitNumber: data.unitNumber,
        squareFeet: data.squareFeet || undefined,
        description: data.description,
        amenityIds: data.amenityIds,
        residentialDetails: {
          unitType: data.unitType,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          hasBalcony: data.hasBalcony,
          floorNumber: data.floorNumber || undefined,
          isFurnished: data.isFurnished,
        },
      };
      return unitsApi.createResidential(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', userId] });
      toast.success('Residential unit added successfully!');
      reset();
      onSuccess();
    },
    onError: (error) => {
      console.error('Failed to add unit:', error);
      toast.error('Failed to add unit.');
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unitNumber">Unit Number</Label>
          <Input id="unitNumber" {...register('unitNumber')} placeholder="e.g. 101, A1" />
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
          <Input id="bedrooms" type="number" min={0} {...register('bedrooms')} />
          {errors.bedrooms && <p className="text-sm text-red-500">{errors.bedrooms.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Input id="bathrooms" type="number" min={0} step="0.5" {...register('bathrooms')} />
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
        <Input id="description" {...register('description')} />
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
                        id={`amenity-${amenity.id}`}
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
                      <Label htmlFor={`amenity-${amenity.id}`} className="cursor-pointer">
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
          {isSubmitting ? 'Adding...' : 'Add Unit'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function CommercialUnitForm({ onSuccess, userId, selectedPropertyId }: FormProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CommercialUnitFormData>({
    resolver: zodResolver(commercialUnitSchema),
    defaultValues: {
      propertyId: selectedPropertyId,
      amenityIds: [],
      unitType: 'office',
    }
  });

  // Fetch amenities for commercial properties (commercial + common)
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

  const mutation = useMutation({
    mutationFn: (data: CommercialUnitFormData) => {
      // Backend expects commercialDetails nested object
      const payload = {
        propertyId: data.propertyId,
        unitNumber: data.unitNumber,
        squareFeet: data.squareFeet || undefined,
        description: data.description,
        amenityIds: data.amenityIds,
        commercialDetails: {
          unitType: data.unitType,
          floorNumber: data.floorNumber || undefined,
          suiteNumber: data.suiteNumber,
          ceilingHeight: data.ceilingHeight || undefined,
          maxOccupancy: data.maxOccupancy || undefined,
        },
      };
      return unitsApi.createCommercial(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', userId] });
      toast.success('Commercial unit added successfully!');
      reset();
      onSuccess();
    },
    onError: (error) => {
      console.error('Failed to add unit:', error);
      toast.error('Failed to add unit.');
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unitNumber">Unit Number</Label>
          <Input id="unitNumber" {...register('unitNumber')} placeholder="e.g. 101, A1" />
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
          <Input id="suiteNumber" {...register('suiteNumber')} placeholder="e.g. Suite 100" />
          {errors.suiteNumber && <p className="text-sm text-red-500">{errors.suiteNumber.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="floorNumber">Floor Number (Optional)</Label>
          <Input id="floorNumber" type="number" {...register('floorNumber')} />
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
          <Label htmlFor="ceilingHeight">Ceiling Height (ft) (Optional)</Label>
          <Input id="ceilingHeight" type="number" step="0.1" {...register('ceilingHeight')} />
          {errors.ceilingHeight && <p className="text-sm text-red-500">{errors.ceilingHeight.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxOccupancy">Max Occupancy (Optional)</Label>
          <Input id="maxOccupancy" type="number" {...register('maxOccupancy')} />
          {errors.maxOccupancy && <p className="text-sm text-red-500">{errors.maxOccupancy.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Input id="description" {...register('description')} />
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
                        id={`amenity-comm-${amenity.id}`}
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
                      <Label htmlFor={`amenity-comm-${amenity.id}`} className="cursor-pointer">
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
          {isSubmitting ? 'Adding...' : 'Add Unit'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function BulkResidentialForm({ onSuccess, userId, selectedPropertyId }: FormProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BulkResidentialFormData>({
    resolver: zodResolver(bulkResidentialSchema),
    defaultValues: {
      propertyId: selectedPropertyId,
      units: [{ unitNumber: '', unitType: 'apartment', bedrooms: 1, bathrooms: 1 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "units"
  });

  const mutation = useMutation({
    mutationFn: (data: BulkResidentialFormData) => {
      // Backend expects residentialDetails nested in each unit
      const payload = {
        propertyId: data.propertyId,
        units: data.units.map(unit => ({
          unitNumber: unit.unitNumber,
          squareFeet: unit.squareFeet || undefined,
          residentialDetails: {
            unitType: unit.unitType,
            bedrooms: unit.bedrooms,
            bathrooms: unit.bathrooms,
          },
        })),
      };
      return unitsApi.createBulkResidential(payload);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['units', userId] });
      toast.success(`Successfully added ${response.data.created.length} units.`);
      if (response.data.failed?.length > 0) {
        toast.warning(`${response.data.failed.length} units were skipped.`);
      }
      reset();
      onSuccess();
    },
    onError: (error) => {
      console.error('Failed to add units:', error);
      toast.error('Failed to add units.');
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Units List</Label>
          <Button
            type="button"
            onClick={() => append({ unitNumber: '', unitType: 'apartment', bedrooms: 1, bathrooms: 1 })}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Row
          </Button>
        </div>

        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Unit #</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">Bed</th>
                <th className="p-2 text-left">Bath</th>
                <th className="p-2 text-left">Sq Ft</th>
                <th className="p-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <tr key={field.id} className="border-t">
                  <td className="p-2">
                    <Input
                      {...register(`units.${index}.unitNumber`)}
                      placeholder="e.g. 101"
                      className={errors.units?.[index]?.unitNumber ? "border-red-500" : ""}
                    />
                  </td>
                  <td className="p-2">
                    <Controller
                      name={`units.${index}.unitType`}
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {residentialUnitTypes.map((type) => (
                              <SelectItem key={type} value={type}>{capitalize(type)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min={0}
                      {...register(`units.${index}.bedrooms`)}
                      className="w-16"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min={0}
                      step="0.5"
                      {...register(`units.${index}.bathrooms`)}
                      className="w-16"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min={0}
                      {...register(`units.${index}.squareFeet`)}
                      placeholder="Opt"
                      className="w-20"
                    />
                  </td>
                  <td className="p-2">
                    <Button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add All Units'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function BulkCommercialForm({ onSuccess, userId, selectedPropertyId }: FormProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BulkCommercialFormData>({
    resolver: zodResolver(bulkCommercialSchema),
    defaultValues: {
      propertyId: selectedPropertyId,
      units: [{ unitNumber: '', unitType: 'office' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "units"
  });

  const mutation = useMutation({
    mutationFn: (data: BulkCommercialFormData) => {
      // Backend expects commercialDetails nested in each unit
      const payload = {
        propertyId: data.propertyId,
        units: data.units.map(unit => ({
          unitNumber: unit.unitNumber,
          squareFeet: unit.squareFeet || undefined,
          commercialDetails: {
            unitType: unit.unitType,
            suiteNumber: unit.suiteNumber,
          },
        })),
      };
      return unitsApi.createBulkCommercial(payload);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['units', userId] });
      toast.success(`Successfully added ${response.data.created.length} units.`);
      if (response.data.failed?.length > 0) {
        toast.warning(`${response.data.failed.length} units were skipped.`);
      }
      reset();
      onSuccess();
    },
    onError: (error) => {
      console.error('Failed to add units:', error);
      toast.error('Failed to add units.');
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Units List</Label>
          <Button
            type="button"
            onClick={() => append({ unitNumber: '', unitType: 'office' })}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Row
          </Button>
        </div>

        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Unit #</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">Suite #</th>
                <th className="p-2 text-left">Sq Ft</th>
                <th className="p-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <tr key={field.id} className="border-t">
                  <td className="p-2">
                    <Input
                      {...register(`units.${index}.unitNumber`)}
                      placeholder="e.g. 101"
                      className={errors.units?.[index]?.unitNumber ? "border-red-500" : ""}
                    />
                  </td>
                  <td className="p-2">
                    <Controller
                      name={`units.${index}.unitType`}
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {commercialUnitTypes.map((type) => (
                              <SelectItem key={type} value={type}>{capitalize(type)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      {...register(`units.${index}.suiteNumber`)}
                      placeholder="Opt"
                      className="w-24"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min={0}
                      {...register(`units.${index}.squareFeet`)}
                      placeholder="Opt"
                      className="w-20"
                    />
                  </td>
                  <td className="p-2">
                    <Button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add All Units'}
        </Button>
      </DialogFooter>
    </form>
  );
}
