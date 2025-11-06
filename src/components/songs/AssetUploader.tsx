import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2, Link2 } from 'lucide-react';
import { AssetType } from '@/types/song';

interface AssetUploaderProps {
  songId: number;
  onUploadComplete: (asset: any) => void;
  onCancel?: () => void;
}

const assetTypes: { value: AssetType; label: string }[] = [
  { value: 'cover_art', label: 'Cover Art' },
  { value: 'back_cover', label: 'Back Cover' },
  { value: 'press_photo', label: 'Press Photo' },
  { value: 'promotional_graphic', label: 'Promotional Graphic' },
  { value: 'social_media_asset', label: 'Social Media Asset' },
  { value: 'marketing_copy', label: 'Marketing Copy' },
  { value: 'other', label: 'Other' },
];

const formSchema = z.object({
  asset_type: z.string().min(1, 'Asset type is required'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(500).optional(),
  google_drive_url: z.string().url('Must be a valid URL').min(1, 'Google Drive URL is required'),
});

type FormValues = z.infer<typeof formSchema>;

export const AssetUploader = ({ songId, onUploadComplete, onCancel }: AssetUploaderProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      asset_type: '',
      title: '',
      description: '',
      google_drive_url: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Import the API function dynamically to avoid circular dependencies
      const { createAsset } = await import('@/api/songApi');
      const response = await createAsset(songId, data as any);
      onUploadComplete(response.data);
      form.reset();
    } catch (error) {
      console.error('Failed to upload asset:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="asset_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select asset type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {assetTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the type of marketing asset you are uploading.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Album Cover - Final Version" {...field} />
                </FormControl>
                <FormDescription>
                  Give this asset a descriptive title.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="google_drive_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Google Drive URL</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      className="pl-9"
                      placeholder="https://drive.google.com/file/d/..."
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Paste the Google Drive share link for this asset. Make sure sharing is enabled.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Additional notes about this asset, version info, or special instructions..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Asset
                </>
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};
