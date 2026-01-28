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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CLASSIFICATION_OPTIONS,
  CREATIVE_TYPE_OPTIONS,
  CLIENT_TYPE_OPTIONS,
} from '@/api/services/entities.service';
import { EntityFormValues } from './types';

interface ClassificationSectionProps {
  form: UseFormReturn<EntityFormValues>;
}

export function ClassificationSection({ form }: ClassificationSectionProps) {
  return (
    <div className="pt-4 border-t space-y-4">
      <h3 className="text-sm font-medium">Classification</h3>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="classification"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Classification *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select classification" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CLASSIFICATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="entity_type"
          render={({ field }) => {
            const classification = form.watch('classification');
            const typeOptions = classification === 'CREATIVE'
              ? CREATIVE_TYPE_OPTIONS
              : CLIENT_TYPE_OPTIONS;

            return (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>

      <FormField
        control={form.control}
        name="is_internal"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
            <FormControl>
              <input
                type="checkbox"
                checked={field.value}
                onChange={field.onChange}
                className="h-4 w-4"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Internal / Signed</FormLabel>
              <FormDescription>
                Signed artist or internal team member
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}
