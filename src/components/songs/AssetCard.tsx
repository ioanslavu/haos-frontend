import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SongAsset, AssetReviewStatus } from '@/types/song';
import { CheckCircle, XCircle, AlertCircle, ExternalLink, FileIcon, Image, FileText, Palette } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AssetCardProps {
  asset: SongAsset;
  onReview?: (action: 'approve' | 'reject' | 'revision_requested', notes?: string) => void;
  canReview?: boolean;
}

const assetTypeLabels: Record<string, string> = {
  cover_art: 'Cover Art',
  back_cover: 'Back Cover',
  press_photo: 'Press Photo',
  promotional_graphic: 'Promotional Graphic',
  social_media_asset: 'Social Media Asset',
  marketing_copy: 'Marketing Copy',
  other: 'Other',
};

const reviewStatusConfig: Record<AssetReviewStatus, { label: string; icon: any; className: string }> = {
  pending: {
    label: 'Pending Review',
    icon: AlertCircle,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 border-green-300',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 border-red-300',
  },
  revision_requested: {
    label: 'Revision Requested',
    icon: AlertCircle,
    className: 'bg-orange-100 text-orange-800 border-orange-300',
  },
};

const getAssetIcon = (assetType: string) => {
  switch (assetType) {
    case 'cover_art':
    case 'back_cover':
    case 'press_photo':
      return Image;
    case 'promotional_graphic':
    case 'social_media_asset':
      return Palette;
    case 'marketing_copy':
      return FileText;
    default:
      return FileIcon;
  }
};

export const AssetCard = ({ asset, onReview, canReview = false }: AssetCardProps) => {
  const [reviewNotes, setReviewNotes] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const statusConfig = reviewStatusConfig[asset.review_status];
  const StatusIcon = statusConfig.icon;
  const AssetIcon = getAssetIcon(asset.asset_type);

  const handleReview = (action: 'approve' | 'reject' | 'revision_requested') => {
    if (onReview) {
      onReview(action, reviewNotes || undefined);
      setReviewNotes('');
      setShowReviewForm(false);
    }
  };

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      asset.review_status === 'approved' && "border-green-200",
      asset.review_status === 'rejected' && "border-red-200",
      asset.review_status === 'revision_requested' && "border-orange-200"
    )}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base mb-2">{asset.title}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{assetTypeLabels[asset.asset_type]}</Badge>
              <Badge className={statusConfig.className}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>
          <div className="flex-shrink-0">
            <AssetIcon className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {asset.description && (
          <p className="text-sm text-gray-600">{asset.description}</p>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(asset.google_drive_url, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View in Google Drive
          </Button>
          {asset.file_extension && (
            <span className="text-xs text-muted-foreground">.{asset.file_extension}</span>
          )}
        </div>

        {asset.review_notes && (
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs font-medium text-gray-700 mb-1">Review Notes:</p>
            <p className="text-sm text-gray-600">{asset.review_notes}</p>
            {asset.reviewed_by && asset.reviewed_at && (
              <p className="text-xs text-muted-foreground mt-2">
                By {asset.reviewed_by.full_name} on{' '}
                {new Date(asset.reviewed_at).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Uploaded by {asset.created_by.full_name} on{' '}
          {new Date(asset.created_at).toLocaleDateString()}
        </div>
      </CardContent>

      {canReview && asset.review_status === 'pending' && (
        <CardFooter className="flex-col gap-3 items-stretch">
          {!showReviewForm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReviewForm(true)}
            >
              Review Asset
            </Button>
          ) : (
            <div className="space-y-3">
              <Textarea
                placeholder="Review notes (optional)"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleReview('approve')}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReview('revision_requested')}
                  className="flex-1"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Request Revision
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleReview('reject')}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowReviewForm(false);
                  setReviewNotes('');
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
};
