import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SongAsset, AssetReviewStatus } from '@/types/song';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  FileIcon,
  Image,
  FileText,
  Palette,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Download,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface AssetGridCardProps {
  asset: SongAsset;
  selected: boolean;
  onSelect: () => void;
  onReview?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  viewMode: 'grid' | 'list';
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

const isImageType = (assetType: string) => {
  return ['cover_art', 'back_cover', 'press_photo', 'promotional_graphic', 'social_media_asset'].includes(assetType);
};

const getGoogleDriveThumbnail = (url: string) => {
  // Extract file ID from Google Drive URL
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    const fileId = match[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
  }
  return null;
};

export const AssetGridCard = ({
  asset,
  selected,
  onSelect,
  onReview,
  onEdit,
  onDelete,
  viewMode,
}: AssetGridCardProps) => {
  const statusConfig = reviewStatusConfig[asset.review_status];
  const StatusIcon = statusConfig.icon;
  const AssetIcon = getAssetIcon(asset.asset_type);
  const showImage = isImageType(asset.asset_type);
  const thumbnailUrl = showImage ? getGoogleDriveThumbnail(asset.google_drive_url) : null;

  const handleDownload = () => {
    window.open(asset.google_drive_url, '_blank');
  };

  if (viewMode === 'list') {
    return (
      <Card
        className={cn(
          'transition-all hover:shadow-md',
          selected && 'ring-2 ring-primary',
          asset.review_status === 'approved' && 'border-green-200',
          asset.review_status === 'rejected' && 'border-red-200',
          asset.review_status === 'revision_requested' && 'border-orange-200'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Checkbox */}
            <Checkbox checked={selected} onCheckedChange={onSelect} />

            {/* Icon/Thumbnail */}
            <div className="flex-shrink-0">
              {thumbnailUrl ? (
                <div className="w-16 h-16 rounded overflow-hidden bg-gray-100">
                  <img
                    src={thumbnailUrl}
                    alt={asset.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `<div class="w-16 h-16 flex items-center justify-center"><svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>`;
                    }}
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center">
                  <AssetIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{asset.title}</h3>
                  {asset.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                      {asset.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {assetTypeLabels[asset.asset_type]}
                    </Badge>
                    <Badge variant="outline" className={cn('text-xs', statusConfig.className)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                    {asset.file_extension && (
                      <Badge variant="secondary" className="text-xs">
                        .{asset.file_extension}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleDownload}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      {onReview && (
                        <DropdownMenuItem onClick={onReview}>
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <DropdownMenuItem onClick={onEdit}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={onDelete} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  By {asset.created_by.full_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>

          {/* Review Notes */}
          {asset.review_notes && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs font-medium text-gray-700 mb-1">Review Notes:</p>
              <p className="text-sm text-gray-600">{asset.review_notes}</p>
              {asset.reviewed_by && asset.reviewed_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  By {asset.reviewed_by.full_name} on{' '}
                  {new Date(asset.reviewed_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <Card
      className={cn(
        'group relative transition-all hover:shadow-lg overflow-hidden',
        selected && 'ring-2 ring-primary',
        asset.review_status === 'approved' && 'border-green-200',
        asset.review_status === 'rejected' && 'border-red-200',
        asset.review_status === 'revision_requested' && 'border-orange-200'
      )}
    >
      {/* Checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <Checkbox checked={selected} onCheckedChange={onSelect} className="bg-white" />
      </div>

      {/* Actions Menu */}
      <div className="absolute top-2 right-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="bg-white/90 backdrop-blur-sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            {onReview && (
              <DropdownMenuItem onClick={onReview}>
                <Eye className="h-4 w-4 mr-2" />
                Review
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Preview/Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={asset.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const icon = document.createElement('div');
                icon.className = 'absolute inset-0 flex items-center justify-center';
                icon.innerHTML = '<svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                parent.appendChild(icon);
              }
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <AssetIcon className="w-16 h-16 text-gray-400" />
          </div>
        )}

        {/* Status Badge Overlay */}
        <div className="absolute bottom-2 left-2">
          <Badge variant="outline" className={cn('backdrop-blur-sm', statusConfig.className)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm line-clamp-1">{asset.title}</h3>
              <Badge variant="outline" className="text-xs mt-1">
                {assetTypeLabels[asset.asset_type]}
              </Badge>
            </div>
          </div>

          {asset.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{asset.description}</p>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <span>{asset.created_by.full_name}</span>
            {asset.file_extension && <span>.{asset.file_extension}</span>}
          </div>

          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}
          </p>
        </div>

        {/* Review Notes */}
        {asset.review_notes && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs font-medium text-gray-700 mb-1">Review Notes:</p>
            <p className="text-xs text-gray-600 line-clamp-2">{asset.review_notes}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={handleDownload}>
          <ExternalLink className="h-3 w-3 mr-2" />
          Open
        </Button>
        {onReview && asset.review_status === 'pending' && (
          <Button size="sm" className="flex-1" onClick={onReview}>
            <Eye className="h-3 w-3 mr-2" />
            Review
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
