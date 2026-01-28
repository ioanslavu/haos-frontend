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
import { EntityFormValues } from './types';

interface BusinessSectionProps {
  form: UseFormReturn<EntityFormValues>;
}

export function BusinessSection({ form }: BusinessSectionProps) {
  return (
    <div className="space-y-4">
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
    </div>
  );
}
