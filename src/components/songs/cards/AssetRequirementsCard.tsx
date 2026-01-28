import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SongAsset } from '@/types/song';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssetRequirementsCardProps {
  assets: SongAsset[];
}

interface Requirement {
  id: string;
  type: string;
  label: string;
  required: boolean;
  description: string;
}

const ASSET_REQUIREMENTS: Requirement[] = [
  {
    id: 'cover_art',
    type: 'cover_art',
    label: 'Cover Art',
    required: true,
    description: 'Album or single cover artwork (minimum 3000x3000px)',
  },
  {
    id: 'back_cover',
    type: 'back_cover',
    label: 'Back Cover',
    required: false,
    description: 'Back cover artwork for physical releases',
  },
  {
    id: 'press_photo',
    type: 'press_photo',
    label: 'Press Photo',
    required: true,
    description: 'High-resolution artist press photo',
  },
  {
    id: 'promotional_graphic',
    type: 'promotional_graphic',
    label: 'Promotional Graphics',
    required: false,
    description: 'Marketing materials and promotional graphics',
  },
  {
    id: 'social_media_asset',
    type: 'social_media_asset',
    label: 'Social Media Assets',
    required: true,
    description: 'Social media posts and promotional content',
  },
];

export const AssetRequirementsCard = ({ assets }: AssetRequirementsCardProps) => {
  const requirementStatus = useMemo(() => {
    return ASSET_REQUIREMENTS.map((req) => {
      const matchingAssets = assets.filter((asset) => asset.asset_type === req.type);
      const approvedAssets = matchingAssets.filter((asset) => asset.review_status === 'approved');
      const pendingAssets = matchingAssets.filter((asset) => asset.review_status === 'pending');
      const revisionRequestedAssets = matchingAssets.filter(
        (asset) => asset.review_status === 'revision_requested'
      );

      let status: 'complete' | 'pending' | 'missing' | 'needs_revision';

      if (approvedAssets.length > 0) {
        status = 'complete';
      } else if (revisionRequestedAssets.length > 0) {
        status = 'needs_revision';
      } else if (pendingAssets.length > 0) {
        status = 'pending';
      } else {
        status = 'missing';
      }

      return {
        ...req,
        status,
        count: matchingAssets.length,
        approvedCount: approvedAssets.length,
      };
    });
  }, [assets]);

  const stats = useMemo(() => {
    const requiredItems = requirementStatus.filter((r) => r.required);
    const completedRequired = requiredItems.filter((r) => r.status === 'complete').length;
    const totalRequired = requiredItems.length;
    const allCompleted = requirementStatus.filter((r) => r.status === 'complete').length;
    const total = requirementStatus.length;

    return {
      requiredComplete: completedRequired,
      requiredTotal: totalRequired,
      allComplete: allCompleted,
      total,
      isRequiredComplete: completedRequired === totalRequired,
    };
  }, [requirementStatus]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'needs_revision':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'missing':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'complete':
        return 'Approved';
      case 'pending':
        return 'Pending Review';
      case 'needs_revision':
        return 'Needs Revision';
      case 'missing':
        return 'Not Uploaded';
      default:
        return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'needs_revision':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'missing':
        return 'bg-gray-100 text-gray-600 border-gray-300';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Asset Requirements</CardTitle>
            <CardDescription>
              Track required and optional marketing assets for this release
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {stats.requiredComplete}/{stats.requiredTotal}
            </div>
            <div className="text-xs text-muted-foreground">Required Complete</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex-1">
            <p className="text-sm font-medium mb-2">Required Assets</p>
            <div className="flex items-center gap-2">
              {stats.isRequiredComplete ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  All Required Complete
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {stats.requiredTotal - stats.requiredComplete} Required Missing
                </Badge>
              )}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium mb-2">All Assets</p>
            <div className="text-sm text-muted-foreground">
              {stats.allComplete} of {stats.total} complete
            </div>
          </div>
        </div>

        {/* Requirements List */}
        <div className="space-y-2">
          {requirementStatus.map((req) => (
            <div
              key={req.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border transition-colors',
                req.status === 'complete' && 'border-green-200 bg-green-50/50',
                req.status === 'pending' && 'border-yellow-200 bg-yellow-50/50',
                req.status === 'needs_revision' && 'border-orange-200 bg-orange-50/50',
                req.status === 'missing' && 'border-gray-200 bg-gray-50/50'
              )}
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-0.5">{getStatusIcon(req.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{req.label}</p>
                    {req.required && (
                      <Badge variant="outline" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{req.description}</p>
                  {req.count > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {req.approvedCount > 0 && `${req.approvedCount} approved`}
                      {req.approvedCount > 0 && req.count > req.approvedCount && ', '}
                      {req.count > req.approvedCount && `${req.count - req.approvedCount} pending/revision`}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant="outline" className={cn('ml-2', getStatusColor(req.status))}>
                {getStatusLabel(req.status)}
              </Badge>
            </div>
          ))}
        </div>

        {/* Helpful Info */}
        {!stats.isRequiredComplete && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-900 mb-1">Next Steps</p>
            <p className="text-xs text-blue-800">
              Upload and get approval for all required assets before proceeding to Digital Distribution.
              Optional assets can enhance your release promotion.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
