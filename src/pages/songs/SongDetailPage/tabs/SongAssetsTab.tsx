import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AssetCard, AssetUploader } from '@/components/songs';
import { SongAsset } from '@/types/song';

interface SongAssetsTabProps {
  songId: number;
  assets: SongAsset[];
  canUploadAssets: boolean;
  canReviewAssets: boolean;
  showAssetUploader: boolean;
  onShowUploader: () => void;
  onHideUploader: () => void;
  onUploadComplete: (asset: SongAsset) => void;
  onReviewAsset: (assetId: number, action: 'approve' | 'reject' | 'revision_requested', notes?: string) => void;
}

export function SongAssetsTab({
  songId,
  assets,
  canUploadAssets,
  canReviewAssets,
  showAssetUploader,
  onShowUploader,
  onHideUploader,
  onUploadComplete,
  onReviewAsset,
}: SongAssetsTabProps) {
  return (
    <div className="space-y-8">
      {canUploadAssets && (
        <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <CardTitle>Upload Marketing Assets</CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload cover art, promotional graphics, press photos, and other marketing materials for this song.
            </p>
          </CardHeader>
          <CardContent>
            {!showAssetUploader ? (
              <Button
                onClick={onShowUploader}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                Upload New Asset
              </Button>
            ) : (
              <AssetUploader
                songId={songId}
                onUploadComplete={onUploadComplete}
                onCancel={onHideUploader}
              />
            )}
          </CardContent>
        </Card>
      )}

      {canReviewAssets && assets.some(a => a.review_status === 'pending') && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-yellow-800">
              Assets Pending Review: {assets.filter(a => a.review_status === 'pending').length}
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Please review all pending assets before sending this song to Digital Distribution.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
        <CardHeader>
          <CardTitle>Asset Gallery</CardTitle>
          <p className="text-sm text-muted-foreground">
            {assets.length === 0
              ? 'No assets have been uploaded yet.'
              : `${assets.length} ${assets.length === 1 ? 'asset' : 'assets'} uploaded`
            }
          </p>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>No assets uploaded yet.</p>
              {canUploadAssets && (
                <p className="text-xs mt-2">Click "Upload New Asset" above to add marketing materials.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  canReview={canReviewAssets}
                  onReview={(action, notes) => onReviewAsset(asset.id, action, notes)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
