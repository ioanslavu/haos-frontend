/**
 * Usage Terms Admin Page
 * Manage usage terms templates
 */

import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function UsageTermsAdmin() {
  // TODO: Implement API hooks when available
  const usageTerms: any[] = [];

  return (
    <AppLayout>
      <div className="container max-w-7xl py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Usage Terms</h1>
            <p className="text-muted-foreground mt-2">
              Manage usage rights and licensing terms templates
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Terms
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Territory</TableHead>
                <TableHead>Media Types</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageTerms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No usage terms found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                usageTerms.map((term) => (
                  <TableRow key={term.id}>
                    <TableCell className="font-semibold">{term.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {term.duration_months ? `${term.duration_months} months` : 'Unlimited'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {term.territory || 'Worldwide'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {term.media_types?.slice(0, 3).map((media: string) => (
                          <Badge key={media} variant="secondary" className="text-xs">
                            {media}
                          </Badge>
                        ))}
                        {term.media_types?.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{term.media_types.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={term.is_active ? 'default' : 'secondary'}>
                        {term.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  );
}
