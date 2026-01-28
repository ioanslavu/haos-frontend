import * as z from 'zod';
import { Entity, EntityClassification, EntityType } from '@/api/services/entities.service';

export const entityFormSchema = z.object({
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
  id_issued_date: z.string().optional(),
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
  // Classification fields
  classification: z.enum(['CREATIVE', 'CLIENT']),
  is_internal: z.boolean().optional(),
  entity_type: z.string().optional().nullable(),
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

export type EntityFormValues = z.infer<typeof entityFormSchema>;

export interface EntityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity?: Entity | null;
  defaultClassification?: EntityClassification;
  defaultEntityType?: EntityType;
  onSuccess?: (entity: Entity) => void;
}

export const DEFAULT_FORM_VALUES: EntityFormValues = {
  kind: 'PF',
  display_name: '',
  alias_name: '',
  first_name: '',
  last_name: '',
  stage_name: '',
  gender: '',
  nationality: '',
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
  classification: 'CREATIVE',
  is_internal: false,
  entity_type: 'artist',
};
