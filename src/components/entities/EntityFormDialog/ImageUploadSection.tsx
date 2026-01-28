import React from 'react';
import { Upload, X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ImageUploadSectionProps {
  imagePreview: string | null;
  uploadingImage: boolean;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
}

export function ImageUploadSection({
  imagePreview,
  uploadingImage,
  onImageSelect,
  onRemoveImage,
}: ImageUploadSectionProps) {
  return (
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
                onClick={onRemoveImage}
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
            onChange={onImageSelect}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground">
            Recommended: Square image, at least 400x400px. JPG or PNG.
          </p>
        </div>
      </div>
    </div>
  );
}
