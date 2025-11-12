import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Helper function to extract date of birth from Romanian CNP
const extractDOBFromCNP = (cnp: string): string | null => {
  if (!cnp || cnp.length !== 13) return null;

  try {
    const sexCentury = parseInt(cnp[0]);
    const year = parseInt(cnp.substring(1, 3));
    const month = parseInt(cnp.substring(3, 5));
    const day = parseInt(cnp.substring(5, 7));

    // Determine century
    let century: number;
    if (sexCentury === 1 || sexCentury === 2) {
      century = 1900;
    } else if (sexCentury === 3 || sexCentury === 4) {
      century = 1800;
    } else if (sexCentury === 5 || sexCentury === 6) {
      century = 2000;
    } else if (sexCentury === 7 || sexCentury === 8 || sexCentury === 9) {
      // Residents/foreigners - assume based on year
      century = year > 30 ? 1900 : 2000;
    } else {
      return null;
    }

    const fullYear = century + year;

    // Validate month and day
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    // Format as YYYY-MM-DD for date input
    return `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  } catch (error) {
    return null;
  }
};
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateEntity, useUpdateEntity, entityKeys } from '@/api/hooks/useEntities';
import { Entity } from '@/api/services/entities.service';
import entitiesService from '@/api/services/entities.service';
import { Loader2, Upload, X, Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQueryClient } from '@tanstack/react-query';

const entityFormSchema = z.object({
  kind: z.enum(['PF', 'PJ']),
  display_name: z.string().min(1, 'Name is required'),
  alias_name: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  stage_name: z.string().optional(),
  gender: z.enum(['M', 'F', 'O', '']).optional(),
  nationality: z.string().optional(),

  // Sensitive identity fields
  identification_type: z.enum(['ID_CARD', 'PASSPORT']).optional(),
  cnp: z.string().optional(),
  id_series: z.string().optional(),
  id_number: z.string().optional(),
  passport_number: z.string().optional(),
  passport_country: z.string().optional(),
  id_issued_by: z.string().optional(),
  id_issued_date: z.string().optional(), // Will be converted to date on backend
  id_expiry_date: z.string().optional(),
  date_of_birth: z.string().optional(),
  place_of_birth: z.string().optional(),

  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  country: z.string().optional(),
  company_registration_number: z.string().optional(),
  vat_number: z.string().optional(),
  iban: z.string().optional(),
  bank_name: z.string().optional(),
  bank_branch: z.string().optional(),
  notes: z.string().optional(),
  roles: z.array(z.object({
    role: z.string(),
    is_internal: z.boolean().optional()
  })).optional(),
  primary_role: z.string().optional(),
}).refine((data) => {
  // For PF entities, require first_name and last_name
  if (data.kind === 'PF') {
    return data.first_name && data.first_name.trim().length > 0 &&
           data.last_name && data.last_name.trim().length > 0;
  }
  return true;
}, {
  message: 'First name and last name are required for physical persons',
  path: ['first_name'],
});

type EntityFormValues = z.infer<typeof entityFormSchema>;

interface EntityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity?: Entity | null;
  role?: string; // Default role for new entities
  onSuccess?: (entity: Entity) => void; // Callback when entity is created/updated
}

export function EntityFormDialog({
  open,
  onOpenChange,
  entity,
  role = 'artist',
  onSuccess,
}: EntityFormDialogProps) {
  const queryClient = useQueryClient();
  const createEntity = useCreateEntity();
  const updateEntity = useUpdateEntity();
  const isEditing = !!entity;
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const form = useForm<EntityFormValues>({
    resolver: zodResolver(entityFormSchema),
    defaultValues: {
      kind: 'PF',
      display_name: '',
      alias_name: '',
      first_name: '',
      last_name: '',
      stage_name: '',
      gender: '',
      nationality: '',
      // Sensitive identity fields
      identification_type: 'ID_CARD',
      cnp: '',
      id_series: '',
      id_number: '',
      passport_number: '',
      passport_country: '',
      id_issued_by: '',
      id_issued_date: '',
      id_expiry_date: '',
      date_of_birth: '',
      place_of_birth: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'Romania',
      company_registration_number: '',
      vat_number: '',
      iban: '',
      bank_name: '',
      bank_branch: '',
      notes: '',
      roles: [{ role, is_internal: false }],
      primary_role: role,
    },
  });

  // Watch the kind field to show/hide legal entity fields
  const kind = form.watch('kind');
  const firstName = form.watch('first_name');
  const lastName = form.watch('last_name');
  const identificationType = form.watch('identification_type');
  const cnp = form.watch('cnp');

  // Auto-compose display name from first and last names for PF entities
  // Format: Last Name First Name
  useEffect(() => {
    if (kind === 'PF' && (firstName || lastName)) {
      const fullName = [lastName, firstName].filter(Boolean).join(' ').trim();
      if (fullName) {
        form.setValue('display_name', fullName);
      }
    }
  }, [firstName, lastName, kind, form]);

  // Auto-extract date of birth from CNP when ID card is selected
  useEffect(() => {
    if (identificationType === 'ID_CARD' && cnp && cnp.length === 13) {
      const dob = extractDOBFromCNP(cnp);
      if (dob) {
        form.setValue('date_of_birth', dob);
      }
    }
  }, [cnp, identificationType, form]);

  // Load entity data when editing
  useEffect(() => {
    if (entity) {
      form.reset({
        kind: entity.kind,
        display_name: entity.display_name,
        alias_name: entity.alias_name || '',
        first_name: entity.first_name || '',
        last_name: entity.last_name || '',
        stage_name: entity.stage_name || '',
        gender: entity.gender || '',
        nationality: entity.nationality || '',
        // Sensitive identity fields
        identification_type: entity.sensitive_identity?.identification_type || 'ID_CARD',
        cnp: '',  // CNP is write-only for security
        id_series: entity.sensitive_identity?.id_series || '',
        id_number: entity.sensitive_identity?.id_number || '',
        passport_number: '',  // Passport number is write-only for security
        passport_country: entity.sensitive_identity?.passport_country || '',
        id_issued_by: entity.sensitive_identity?.id_issued_by || '',
        id_issued_date: entity.sensitive_identity?.id_issued_date || '',
        id_expiry_date: entity.sensitive_identity?.id_expiry_date || '',
        date_of_birth: entity.sensitive_identity?.date_of_birth || '',
        place_of_birth: entity.sensitive_identity?.place_of_birth || '',
        email: entity.email || '',
        phone: entity.phone || '',
        address: entity.address || '',
        city: entity.city || '',
        state: entity.state || '',
        zip_code: entity.zip_code || '',
        country: entity.country || 'Romania',
        company_registration_number: entity.company_registration_number || '',
        vat_number: entity.vat_number || '',
        iban: entity.iban || '',
        bank_name: entity.bank_name || '',
        bank_branch: entity.bank_branch || '',
        notes: entity.notes || '',
        roles: entity.entity_roles?.map(r => ({ role: r.role, is_internal: r.is_internal })) || [{ role, is_internal: false }],
        primary_role: entity.entity_roles?.find(r => r.primary_role)?.role || entity.entity_roles?.[0]?.role || role,
      });
    }
  }, [entity, form, role]);

  // Load existing image when editing
  useEffect(() => {
    if (entity?.image_url) {
      setImagePreview(entity.image_url);
    } else {
      setImagePreview(null);
    }
    setSelectedImage(null);
  }, [entity]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const onSubmit = async (values: EntityFormValues) => {
    try {
      const payload = {
        ...values,
        roles: values.roles && values.roles.length > 0 ? values.roles : [values.primary_role || role],
        primary_role: values.primary_role || role,
      };

      let savedEntity: Entity | undefined;
      if (isEditing && entity) {
        savedEntity = await updateEntity.mutateAsync({ id: entity.id, payload: payload as any });
      } else {
        savedEntity = await createEntity.mutateAsync(payload as any);
      }

      // Upload image if one was selected
      if (selectedImage && savedEntity) {
        setUploadingImage(true);
        try {
          savedEntity = await entitiesService.uploadEntityImage(savedEntity.id, selectedImage);
          // Invalidate queries to refresh the entity list with new image
          queryClient.invalidateQueries({ queryKey: entityKeys.lists() });
          queryClient.invalidateQueries({ queryKey: entityKeys.detail(savedEntity.id) });
        } catch (error) {
          console.error('Failed to upload image:', error);
        } finally {
          setUploadingImage(false);
        }
      }

      form.reset();
      setSelectedImage(null);
      setImagePreview(null);
      onOpenChange(false);

      // Call onSuccess callback if provided
      if (onSuccess && savedEntity) {
        onSuccess(savedEntity);
      }
    } catch (error) {
      console.error('Failed to save entity:', error);
    }
  };

  const isSubmitting = createEntity.isPending || updateEntity.isPending || uploadingImage;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Entity' : 'Add New Entity'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the entity information below.'
              : 'Fill in the details to create a new entity.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                {kind === 'PJ' && <TabsTrigger value="business">Business</TabsTrigger>}
                {kind === 'PF' && <TabsTrigger value="additional">Additional</TabsTrigger>}
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="kind"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entity Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select entity type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PF">Physical Person</SelectItem>
                          <SelectItem value="PJ">Legal Entity (Company)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {kind === 'PF' ? 'Full Name' : 'Company Name'} *
                      </FormLabel>
                      <FormControl>
                        <Input {...field} readOnly={kind === 'PF'} className={kind === 'PF' ? 'bg-muted' : ''} />
                      </FormControl>
                      <FormDescription>
                        {kind === 'PF'
                          ? 'Auto-generated from first and last name'
                          : 'The complete name as it appears in documents'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="alias_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alias / Alternative Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., nickname, brand name, DBA" />
                      </FormControl>
                      <FormDescription>
                        Optional alternative name or alias for this entity
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Photo (Optional)</label>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={imagePreview || undefined} />
                      <AvatarFallback className="text-2xl bg-muted">
                        <Camera className="h-10 w-10 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('entity-image-upload')?.click()}
                          disabled={uploadingImage}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {imagePreview ? 'Change Photo' : 'Upload Photo'}
                        </Button>
                        {imagePreview && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveImage}
                            disabled={uploadingImage}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        )}
                      </div>
                      <input
                        id="entity-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground">
                        Recommended: Square image, at least 400x400px. JPG or PNG.
                      </p>
                    </div>
                  </div>
                </div>

                {kind === 'PF' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="John"
                                onChange={(e) => {
                                  const uppercase = e.target.value.toUpperCase();
                                  field.onChange(uppercase);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Doe"
                                onChange={(e) => {
                                  const uppercase = e.target.value.toUpperCase();
                                  field.onChange(uppercase);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="stage_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stage Name / Artist Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. The Weeknd" />
                          </FormControl>
                          <FormDescription>
                            Professional or artistic name used in performances and credits
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          placeholder="Any additional notes..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State/Province</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="zip_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Banking Information */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-4">Banking Information</h3>

                  <FormField
                    control={form.control}
                    name="iban"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IBAN</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="RO49AAAA1B31007593840000"
                            onChange={(e) => {
                              const uppercase = e.target.value.toUpperCase();
                              field.onChange(uppercase);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          International Bank Account Number
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="bank_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Bank name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bank_branch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Branch</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Branch location" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              {kind === 'PJ' && (
                <TabsContent value="business" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="company_registration_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Registration Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Official company registration number
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vat_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VAT Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          VAT identification number for tax purposes
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              )}

              {kind === 'PF' && (
                <TabsContent value="additional" className="space-y-4">
                  {/* Multiple Roles Selection */}
                  <FormField
                    control={form.control}
                    name="roles"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roles (Select all that apply)</FormLabel>
                        <div className="space-y-3">
                          <p className="text-xs text-muted-foreground mb-2">Creative Roles</p>
                          {[
                            { value: 'artist', label: 'Artist' },
                            { value: 'producer', label: 'Producer' },
                            { value: 'composer', label: 'Composer' },
                            { value: 'lyricist', label: 'Lyricist' },
                            { value: 'audio_editor', label: 'Audio Editor' },
                          ].map((roleOption) => {
                            const existingRole = field.value?.find(r => r.role === roleOption.value);
                            const isChecked = !!existingRole;

                            return (
                              <div key={roleOption.value} className="flex items-center justify-between space-x-4 py-1">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`role-${roleOption.value}`}
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        const newRoles = [...(field.value || []), { role: roleOption.value, is_internal: false }];
                                        field.onChange(newRoles);
                                      } else {
                                        const newRoles = (field.value || []).filter(r => r.role !== roleOption.value);
                                        field.onChange(newRoles);
                                      }
                                    }}
                                    className="h-4 w-4"
                                  />
                                  <label htmlFor={`role-${roleOption.value}`} className="text-sm">
                                    {roleOption.label}
                                  </label>
                                </div>
                                {isChecked && (
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`internal-${roleOption.value}`}
                                      checked={existingRole?.is_internal || false}
                                      onChange={(e) => {
                                        const newRoles = (field.value || []).map(r =>
                                          r.role === roleOption.value
                                            ? { ...r, is_internal: e.target.checked }
                                            : r
                                        );
                                        field.onChange(newRoles);
                                      }}
                                      className="h-4 w-4"
                                    />
                                    <label htmlFor={`internal-${roleOption.value}`} className="text-xs text-muted-foreground">
                                      Signed Artist
                                    </label>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <p className="text-xs text-muted-foreground mb-2 mt-4">Business Roles</p>
                          {[
                            { value: 'label', label: 'Label' },
                            { value: 'booking', label: 'Booking' },
                            { value: 'endorsements', label: 'Endorsements' },
                            { value: 'publishing', label: 'Publishing' },
                            { value: 'productie', label: 'Productie' },
                            { value: 'new_business', label: 'New Business' },
                            { value: 'digital', label: 'Digital' },
                          ].map((roleOption) => {
                            const existingRole = field.value?.find(r => r.role === roleOption.value);
                            const isChecked = !!existingRole;

                            return (
                              <div key={roleOption.value} className="flex items-center justify-between space-x-4 py-1">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`role-${roleOption.value}`}
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        const newRoles = [...(field.value || []), { role: roleOption.value, is_internal: false }];
                                        field.onChange(newRoles);
                                      } else {
                                        const newRoles = (field.value || []).filter(r => r.role !== roleOption.value);
                                        field.onChange(newRoles);
                                      }
                                    }}
                                    className="h-4 w-4"
                                  />
                                  <label htmlFor={`role-${roleOption.value}`} className="text-sm">
                                    {roleOption.label}
                                  </label>
                                </div>
                                {isChecked && (
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`internal-${roleOption.value}`}
                                      checked={existingRole?.is_internal || false}
                                      onChange={(e) => {
                                        const newRoles = (field.value || []).map(r =>
                                          r.role === roleOption.value
                                            ? { ...r, is_internal: e.target.checked }
                                            : r
                                        );
                                        field.onChange(newRoles);
                                      }}
                                      className="h-4 w-4"
                                    />
                                    <label htmlFor={`internal-${roleOption.value}`} className="text-xs text-muted-foreground">
                                      Signed Artist
                                    </label>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Primary Role Selection */}
                  <FormField
                    control={form.control}
                    name="primary_role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Role</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select primary role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Creative Roles</div>
                            <SelectItem value="artist">Artist</SelectItem>
                            <SelectItem value="producer">Producer</SelectItem>
                            <SelectItem value="composer">Composer</SelectItem>
                            <SelectItem value="lyricist">Lyricist</SelectItem>
                            <SelectItem value="audio_editor">Audio Editor</SelectItem>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1">Business Roles</div>
                            <SelectItem value="label">Label</SelectItem>
                            <SelectItem value="booking">Booking</SelectItem>
                            <SelectItem value="endorsements">Endorsements</SelectItem>
                            <SelectItem value="publishing">Publishing</SelectItem>
                            <SelectItem value="productie">Productie</SelectItem>
                            <SelectItem value="new_business">New Business</SelectItem>
                            <SelectItem value="digital">Digital</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the main role for this person
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="M">Male</SelectItem>
                              <SelectItem value="F">Female</SelectItem>
                              <SelectItem value="O">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nationality</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. Romanian" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Identification Type Selector */}
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium mb-4">Identification Documents</h3>

                    <FormField
                      control={form.control}
                      name="identification_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select document type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ID_CARD">Romanian ID Card (CI)</SelectItem>
                              <SelectItem value="PASSPORT">Passport</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose the type of identification document
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* ID Card Fields */}
                    {identificationType === 'ID_CARD' && (
                      <>
                        <FormField
                          control={form.control}
                          name="cnp"
                          render={({ field }) => (
                            <FormItem className="mt-4">
                              <FormLabel>CNP (Personal Numeric Code)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="password"
                                  placeholder="1234567890123"
                                  maxLength={13}
                                />
                              </FormControl>
                              <FormDescription>
                                Romanian Personal Identification Number (will be encrypted). Date of birth will be auto-extracted.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <FormField
                            control={form.control}
                            name="id_series"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ID Series</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="XX"
                                    onChange={(e) => {
                                      const uppercase = e.target.value.toUpperCase();
                                      field.onChange(uppercase);
                                    }}
                                    maxLength={2}
                                  />
                                </FormControl>
                                <FormDescription>
                                  ID card series (2 letters)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="id_number"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ID Number</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="123456"
                                    onChange={(e) => {
                                      const uppercase = e.target.value.toUpperCase();
                                      field.onChange(uppercase);
                                    }}
                                    maxLength={6}
                                  />
                                </FormControl>
                                <FormDescription>
                                  ID card number (6 characters)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    )}

                    {/* Passport Fields */}
                    {identificationType === 'PASSPORT' && (
                      <>
                        <FormField
                          control={form.control}
                          name="passport_number"
                          render={({ field }) => (
                            <FormItem className="mt-4">
                              <FormLabel>Passport Number</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" placeholder="123456789" />
                              </FormControl>
                              <FormDescription>
                                Passport identification number (will be encrypted)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="passport_country"
                          render={({ field }) => (
                            <FormItem className="mt-4">
                              <FormLabel>Country of Issuance</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g., Romania, USA, etc." />
                              </FormControl>
                              <FormDescription>
                                Country that issued the passport
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {/* Shared Fields (for both ID card and passport) */}
                    <div className="mt-4 space-y-4">
                      <FormField
                        control={form.control}
                        name="id_issued_by"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Issued By</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Issuing authority" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="id_issued_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Issue Date</FormLabel>
                              <FormControl>
                                <Input {...field} type="date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="id_expiry_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expiry Date</FormLabel>
                              <FormControl>
                                <Input {...field} type="date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="date_of_birth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="date"
                                  className={identificationType === 'ID_CARD' && cnp?.length === 13 ? 'bg-muted' : ''}
                                  readOnly={identificationType === 'ID_CARD' && cnp?.length === 13}
                                />
                              </FormControl>
                              <FormDescription>
                                {identificationType === 'ID_CARD' && cnp?.length === 13
                                  ? 'Auto-extracted from CNP'
                                  : ''}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="place_of_birth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Place of Birth</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="City, Country" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update' : 'Create'} Entity
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}