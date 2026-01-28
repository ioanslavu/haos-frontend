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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EntityFormValues } from './types';

interface IdentificationSectionProps {
  form: UseFormReturn<EntityFormValues>;
  identificationType: 'ID_CARD' | 'PASSPORT' | undefined;
  cnp: string | undefined;
}

export function IdentificationSection({
  form,
  identificationType,
  cnp,
}: IdentificationSectionProps) {
  return (
    <div className="space-y-4">
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
          <IDCardFields form={form} />
        )}

        {/* Passport Fields */}
        {identificationType === 'PASSPORT' && (
          <PassportFields form={form} />
        )}

        {/* Shared Fields */}
        <SharedDocumentFields form={form} identificationType={identificationType} cnp={cnp} />
      </div>
    </div>
  );
}

function IDCardFields({ form }: { form: UseFormReturn<EntityFormValues> }) {
  return (
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
  );
}

function PassportFields({ form }: { form: UseFormReturn<EntityFormValues> }) {
  return (
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
  );
}

interface SharedDocumentFieldsProps {
  form: UseFormReturn<EntityFormValues>;
  identificationType: 'ID_CARD' | 'PASSPORT' | undefined;
  cnp: string | undefined;
}

function SharedDocumentFields({ form, identificationType, cnp }: SharedDocumentFieldsProps) {
  return (
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
  );
}
