import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateEntity, useUpdateEntity, entityKeys } from '@/api/hooks/useEntities';
import entitiesService, { Entity, EntityClassification, EntityType } from '@/api/services/entities.service';
import { entityFormSchema, EntityFormValues, DEFAULT_FORM_VALUES } from '../types';
import { extractDOBFromCNP } from '../utils';

interface UseEntityFormOptions {
  entity?: Entity | null;
  defaultClassification?: EntityClassification;
  defaultEntityType?: EntityType;
  onSuccess?: (entity: Entity) => void;
  onOpenChange: (open: boolean) => void;
}

export function useEntityForm({
  entity,
  defaultClassification = 'CREATIVE',
  defaultEntityType = 'artist',
  onSuccess,
  onOpenChange,
}: UseEntityFormOptions) {
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
      ...DEFAULT_FORM_VALUES,
      classification: defaultClassification,
      entity_type: defaultEntityType,
    },
  });

  // Watch fields for auto-compose and conditional rendering
  const kind = form.watch('kind');
  const firstName = form.watch('first_name');
  const lastName = form.watch('last_name');
  const identificationType = form.watch('identification_type');
  const cnp = form.watch('cnp');

  // Auto-compose display name from first and last names for PF entities
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
        identification_type: entity.sensitive_identity?.identification_type || 'ID_CARD',
        cnp: '', // CNP is write-only for security
        id_series: entity.sensitive_identity?.id_series || '',
        id_number: entity.sensitive_identity?.id_number || '',
        passport_number: '', // Passport number is write-only for security
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
        classification: entity.classification || defaultClassification,
        is_internal: entity.is_internal || false,
        entity_type: entity.entity_type || null,
      });
    }
  }, [entity, form, defaultClassification]);

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
        entity_type: values.entity_type || null,
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

      if (onSuccess && savedEntity) {
        onSuccess(savedEntity);
      }
    } catch (error) {
      console.error('Failed to save entity:', error);
    }
  };

  const isSubmitting = createEntity.isPending || updateEntity.isPending || uploadingImage;

  return {
    form,
    kind,
    identificationType,
    cnp,
    isEditing,
    isSubmitting,
    selectedImage,
    imagePreview,
    uploadingImage,
    handleImageSelect,
    handleRemoveImage,
    onSubmit,
  };
}
