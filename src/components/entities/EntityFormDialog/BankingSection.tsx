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

interface BankingSectionProps {
  form: UseFormReturn<EntityFormValues>;
}

export function BankingSection({ form }: BankingSectionProps) {
  return (
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
  );
}
