import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Package, Tag, Building2, Edit } from 'lucide-react';
import { ReleaseDetails } from '@/types/song';

interface ReleaseDetailsCardProps {
  release: ReleaseDetails;
  canEdit?: boolean;
  onEdit?: () => void;
}

export function ReleaseDetailsCard({ release, canEdit, onEdit }: ReleaseDetailsCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'released':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'scheduled':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'draft':
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
      case 'cancelled':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'single':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
      case 'ep':
        return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400';
      case 'album':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Release Details</CardTitle>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Release
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-3">
          <Badge className={getTypeColor(release.type)}>
            {release.type.toUpperCase()}
          </Badge>
          <Badge className={getStatusColor(release.status)}>
            {release.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {release.upc && (
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">UPC</p>
                <p className="text-base font-mono">{release.upc}</p>
              </div>
            </div>
          )}

          {release.release_date && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Release Date</p>
                <p className="text-base">
                  {new Date(release.release_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}

          {release.label_name && (
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Label</p>
                <p className="text-base">{release.label_name}</p>
              </div>
            </div>
          )}

          {release.catalog_number && (
            <div className="flex items-start gap-3">
              <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Catalog Number</p>
                <p className="text-base font-mono">{release.catalog_number}</p>
              </div>
            </div>
          )}
        </div>

        {release.description && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
            <p className="text-sm">{release.description}</p>
          </div>
        )}

        {release.notes && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-2">Internal Notes</p>
            <p className="text-sm text-muted-foreground">{release.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
