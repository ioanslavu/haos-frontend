import React, { useState } from 'react';
import { useCreateRole } from '@/api/hooks/useRoles';
import { Role } from '@/api/hooks/useRoles';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (role: Role) => void;
}

export function CreateRoleDialog({ open, onOpenChange, onSuccess }: CreateRoleDialogProps) {
  const createRole = useCreateRole();
  const [roleName, setRoleName] = useState('');
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!roleName) {
      setError('Role name is required');
      return;
    }

    if (!/^[A-Z_]+$/.test(roleName)) {
      setError('Role name must be in UPPER_SNAKE_CASE format (e.g., FINANCE_MANAGER)');
      return;
    }

    try {
      const newRole = await createRole.mutateAsync({ name: roleName });
      onSuccess?.(newRole);
      setRoleName('');
      setError('');
    } catch (err) {
      setError('Failed to create role. It may already exist.');
    }
  };

  const handleClose = () => {
    setRoleName('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
          <DialogDescription>
            Create a new role to organize users and permissions. Use UPPER_SNAKE_CASE format for the role name.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="roleName">Role Name</Label>
            <Input
              id="roleName"
              value={roleName}
              onChange={(e) => {
                setRoleName(e.target.value.toUpperCase().replace(/\s+/g, '_'));
                setError('');
              }}
              placeholder="e.g., FINANCE_MANAGER"
              disabled={createRole.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Examples: SUPER_ADMIN, FINANCE_MANAGER, ROYALTY_ACCOUNTANT
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={createRole.isPending}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!roleName || createRole.isPending}>
            {createRole.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Role'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}