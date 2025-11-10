/**
 * Deliverable Packs Admin Page
 * Manage deliverable pack templates
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

export default function DeliverablePacksAdmin() {
  // TODO: Implement API hooks when available
  const deliverablePacks: any[] = [];

  return (
    <AppLayout>
      <div className="container max-w-7xl py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Deliverable Packs</h1>
            <p className="text-muted-foreground mt-2">
              Manage deliverable pack templates for opportunities
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Pack
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliverablePacks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No deliverable packs found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                deliverablePacks.map((pack) => (
                  <TableRow key={pack.id}>
                    <TableCell className="font-semibold">{pack.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {pack.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{pack.items_count || 0} items</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={pack.is_active ? 'default' : 'secondary'}>
                        {pack.is_active ? 'Active' : 'Inactive'}
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
