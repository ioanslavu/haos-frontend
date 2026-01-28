import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EntityFormValues } from './types';
import { ImageUploadSection } from './ImageUploadSection';
import { ClassificationSection } from './ClassificationSection';

interface BasicInfoSectionProps {
  form: UseFormReturn<EntityFormValues>;
  kind: 'PF' | 'PJ';
  imagePreview: string | null;
  uploadingImage: boolean;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
}

export function BasicInfoSection({
  form,
  kind,
  imagePreview,
  uploadingImage,
  onImageSelect,
  onRemoveImage,
}: BasicInfoSectionProps) {
  return (
    <div className="space-y-4">
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

      <ImageUploadSection
        imagePreview={imagePreview}
        uploadingImage={uploadingImage}
        onImageSelect={onImageSelect}
        onRemoveImage={onRemoveImage}
      />

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

      <ClassificationSection form={form} />

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
    </div>
  );
}
