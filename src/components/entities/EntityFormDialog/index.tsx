import React from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { EntityFormDialogProps } from './types';
import { useEntityForm } from './hooks/useEntityForm';
import { BasicInfoSection } from './BasicInfoSection';
import { ContactSection } from './ContactSection';
import { BusinessSection } from './BusinessSection';
import { IdentificationSection } from './IdentificationSection';

export function EntityFormDialog({
  open,
  onOpenChange,
  entity,
  defaultClassification = 'CREATIVE',
  defaultEntityType = 'artist',
  onSuccess,
}: EntityFormDialogProps) {
  const {
    form,
    kind,
    identificationType,
    cnp,
    isEditing,
    isSubmitting,
    imagePreview,
    uploadingImage,
    handleImageSelect,
    handleRemoveImage,
    onSubmit,
  } = useEntityForm({
    entity,
    defaultClassification,
    defaultEntityType,
    onSuccess,
    onOpenChange,
  });

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
                <BasicInfoSection
                  form={form}
                  kind={kind}
                  imagePreview={imagePreview}
                  uploadingImage={uploadingImage}
                  onImageSelect={handleImageSelect}
                  onRemoveImage={handleRemoveImage}
                />
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                <ContactSection form={form} />
              </TabsContent>

              {kind === 'PJ' && (
                <TabsContent value="business" className="space-y-4">
                  <BusinessSection form={form} />
                </TabsContent>
              )}

              {kind === 'PF' && (
                <TabsContent value="additional" className="space-y-4">
                  <IdentificationSection
                    form={form}
                    identificationType={identificationType}
                    cnp={cnp}
                  />
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

// Re-export types for external use
export type { EntityFormDialogProps, EntityFormValues } from './types';
