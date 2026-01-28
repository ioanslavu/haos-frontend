import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AssetUploader } from '../shared/AssetUploader';
import { AssetGridCard } from '../cards/AssetGridCard';
import { AssetReviewDialog } from '../dialogs/AssetReviewDialog';
import { AssetEditDialog } from '../dialogs/AssetEditDialog';
import { AssetRequirementsCard } from '../cards/AssetRequirementsCard';
import { fetchAssets, reviewAsset, updateAsset, deleteAsset } from '@/api/songApi';
import { SongAsset, AssetType, AssetReviewStatus } from '@/types/song';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  Download,
  CheckCircle,
  Filter,
  Grid3x3,
  List,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssetsTabProps {
  songId: number;
  songStage?: string;
}

export const AssetsTab = ({ songId, songStage }: AssetsTabProps) => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // UI State
  const [showUploader, setShowUploader] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [typeFilter, setTypeFilter] = useState<AssetType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AssetReviewStatus | 'all'>('all');
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
  const [reviewingAsset, setReviewingAsset] = useState<SongAsset | null>(null);
  const [editingAsset, setEditingAsset] = useState<SongAsset | null>(null);

  // Data fetching
  const { data: assetsData, isLoading } = useQuery({
    queryKey: ['song-assets', songId],
    queryFn: () => fetchAssets(songId),
  });

  const assets = Array.isArray(assetsData?.data) ? assetsData.data : [];

  // Permissions
  const canReviewAssets = user?.profile?.department?.code === 'Label' && songStage === 'label_review';
  const canUploadAssets = user?.profile?.department?.code === 'Marketing' && songStage === 'marketing_assets';
  const canEditAssets = user?.profile?.department?.code === 'Marketing' || user?.profile?.role?.level >= 1000;
  const canDeleteAssets = user?.profile?.department?.code === 'Marketing' || user?.profile?.role?.level >= 1000;

  // Filtering
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (typeFilter !== 'all' && asset.asset_type !== typeFilter) return false;
      if (statusFilter !== 'all' && asset.review_status !== statusFilter) return false;
      return true;
    });
  }, [assets, typeFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: assets.length,
      pending: assets.filter((a) => a.review_status === 'pending').length,
      approved: assets.filter((a) => a.review_status === 'approved').length,
      rejected: assets.filter((a) => a.review_status === 'rejected').length,
      revisionRequested: assets.filter((a) => a.review_status === 'revision_requested').length,
    };
  }, [assets]);

  // Mutations
  const reviewAssetMutation = useMutation({
    mutationFn: ({
      assetId,
      action,
      notes
    }: {
      assetId: number;
      action: 'approve' | 'reject' | 'revision_requested';
      notes?: string;
    }) => reviewAsset(songId, assetId, { action, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['song-assets', songId] });
      queryClient.invalidateQueries({ queryKey: ['song', songId] });
      setReviewingAsset(null);
      toast({
        title: 'Review Submitted',
        description: 'Your asset review has been recorded.',
      });
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: (assetId: number) => deleteAsset(songId, assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['song-assets', songId] });
      toast({
        title: 'Asset Deleted',
        description: 'The asset has been removed.',
      });
    },
  });

  // Bulk actions
  const handleBulkApprove = async () => {
    if (selectedAssets.length === 0) return;

    try {
      await Promise.all(
        selectedAssets.map((assetId) =>
          reviewAsset(songId, assetId, { action: 'approve' })
        )
      );
      queryClient.invalidateQueries({ queryKey: ['song-assets', songId] });
      setSelectedAssets([]);
      toast({
        title: 'Assets Approved',
        description: `${selectedAssets.length} asset(s) have been approved.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve some assets.',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDownload = () => {
    if (selectedAssets.length === 0) return;

    selectedAssets.forEach((assetId) => {
      const asset = assets.find((a) => a.id === assetId);
      if (asset) {
        window.open(asset.google_drive_url, '_blank');
      }
    });
  };

  const toggleAssetSelection = (assetId: number) => {
    setSelectedAssets((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAssets.length === filteredAssets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(filteredAssets.map((a) => a.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Requirements Card */}
      <AssetRequirementsCard assets={assets} />

      {/* Upload Section */}
      {canUploadAssets && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Marketing Assets</CardTitle>
            <CardDescription>
              Upload cover art, promotional graphics, press photos, and other marketing materials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showUploader ? (
              <Button onClick={() => setShowUploader(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload New Asset
              </Button>
            ) : (
              <AssetUploader
                songId={songId}
                onUploadComplete={() => {
                  queryClient.invalidateQueries({ queryKey: ['song-assets', songId] });
                  setShowUploader(false);
                  toast({
                    title: 'Asset Uploaded',
                    description: 'Your asset has been uploaded successfully.',
                  });
                }}
                onCancel={() => setShowUploader(false)}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Review Alert */}
      {canReviewAssets && stats.pending > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Assets Pending Review: {stats.pending}
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Please review all pending assets before proceeding to Digital Distribution.
                </p>
              </div>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                Action Required
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Asset Grid/List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Asset Gallery</CardTitle>
              <CardDescription>
                {filteredAssets.length === 0
                  ? 'No assets match your filters'
                  : `Showing ${filteredAssets.length} of ${assets.length} asset(s)`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={cn('rounded-r-none', viewMode === 'grid' && 'bg-primary text-primary-foreground')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={cn('rounded-l-none', viewMode === 'list' && 'bg-primary text-primary-foreground')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters and Actions Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filters */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as AssetType | 'all')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="cover_art">Cover Art</SelectItem>
                  <SelectItem value="back_cover">Back Cover</SelectItem>
                  <SelectItem value="press_photo">Press Photo</SelectItem>
                  <SelectItem value="promotional_graphic">Promotional Graphic</SelectItem>
                  <SelectItem value="social_media_asset">Social Media Asset</SelectItem>
                  <SelectItem value="marketing_copy">Marketing Copy</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as AssetReviewStatus | 'all')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="revision_requested">Revision Requested</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            {selectedAssets.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <Badge variant="secondary">{selectedAssets.length} selected</Badge>
                {canReviewAssets && (
                  <Button size="sm" variant="outline" onClick={handleBulkApprove}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Selected
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={handleBulkDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Selected
                </Button>
              </div>
            )}

            {/* Select All */}
            {filteredAssets.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedAssets.length === filteredAssets.length}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-muted-foreground">Select All</span>
              </div>
            )}
          </div>

          {/* Statistics */}
          {assets.length > 0 && (
            <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Total:</span>
                <Badge variant="outline">{stats.total}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Pending:</span>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  {stats.pending}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Approved:</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  {stats.approved}
                </Badge>
              </div>
              {stats.revisionRequested > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Revision Requested:</span>
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                    {stats.revisionRequested}
                  </Badge>
                </div>
              )}
              {stats.rejected > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rejected:</span>
                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                    {stats.rejected}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Assets Grid/List */}
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">
              Loading assets...
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>No assets found.</p>
              {canUploadAssets && !showUploader && (
                <p className="text-xs mt-2">Click "Upload New Asset" above to add marketing materials.</p>
              )}
            </div>
          ) : (
            <div
              className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-3'
              )}
            >
              {filteredAssets.map((asset) => (
                <AssetGridCard
                  key={asset.id}
                  asset={asset}
                  selected={selectedAssets.includes(asset.id)}
                  onSelect={() => toggleAssetSelection(asset.id)}
                  onReview={canReviewAssets ? () => setReviewingAsset(asset) : undefined}
                  onEdit={canEditAssets ? () => setEditingAsset(asset) : undefined}
                  onDelete={canDeleteAssets ? () => {
                    if (confirm('Are you sure you want to delete this asset?')) {
                      deleteAssetMutation.mutate(asset.id);
                    }
                  } : undefined}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      {reviewingAsset && (
        <AssetReviewDialog
          asset={reviewingAsset}
          open={!!reviewingAsset}
          onClose={() => setReviewingAsset(null)}
          onSubmit={(action, notes) => {
            reviewAssetMutation.mutate({
              assetId: reviewingAsset.id,
              action,
              notes,
            });
          }}
          isSubmitting={reviewAssetMutation.isPending}
        />
      )}

      {/* Edit Dialog */}
      {editingAsset && (
        <AssetEditDialog
          asset={editingAsset}
          open={!!editingAsset}
          onClose={() => setEditingAsset(null)}
          songId={songId}
        />
      )}
    </div>
  );
};
