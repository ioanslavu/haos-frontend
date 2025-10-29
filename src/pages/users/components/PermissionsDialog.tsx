import React, { useState } from 'react';
import {
  useUserPermissions,
  useAssignPermission,
  useRemovePermission,
} from '@/api/hooks/useUsers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Plus, Trash2, Users, Key, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PermissionsDialogProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Common permission templates
const PERMISSION_TEMPLATES = [
  { app_label: 'contracts', model: 'contract', permissions: ['add', 'change', 'delete', 'view'] },
  { app_label: 'finance', model: 'payment', permissions: ['approve', 'view'] },
  { app_label: 'finance', model: 'royalty', permissions: ['calculate', 'view'] },
  { app_label: 'catalog', model: 'artist', permissions: ['add', 'change', 'delete', 'view'] },
  { app_label: 'catalog', model: 'track', permissions: ['add', 'change', 'delete', 'view'] },
  { app_label: 'catalog', model: 'album', permissions: ['add', 'change', 'delete', 'view'] },
];

export default function PermissionsDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: PermissionsDialogProps) {
  const { data, isLoading, error } = useUserPermissions(userId);
  const assignPermission = useAssignPermission();
  const removePermission = useRemovePermission();

  const [selectedApp, setSelectedApp] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedPermission, setSelectedPermission] = useState('');

  const handleAssignPermission = () => {
    if (selectedApp && selectedModel && selectedPermission) {
      assignPermission.mutate(
        {
          userId,
          app_label: selectedApp,
          model: selectedModel,
          permission: `${selectedPermission}_${selectedModel}`,
        },
        {
          onSuccess: () => {
            setSelectedApp('');
            setSelectedModel('');
            setSelectedPermission('');
          },
        }
      );
    }
  };

  const handleRemovePermission = (appLabel: string, model: string, permission: string) => {
    removePermission.mutate({
      userId,
      app_label: appLabel,
      model,
      permission,
    });
  };

  const handleRemoveAllPermissions = () => {
    if (confirm('Are you sure you want to remove all direct permissions?')) {
      removePermission.mutate({ userId });
    }
  };

  const getAvailableModels = () => {
    if (!selectedApp) return [];
    return PERMISSION_TEMPLATES.filter((t) => t.app_label === selectedApp).map((t) => t.model);
  };

  const getAvailablePermissions = () => {
    if (!selectedApp || !selectedModel) return [];
    const template = PERMISSION_TEMPLATES.find(
      (t) => t.app_label === selectedApp && t.model === selectedModel
    );
    return template?.permissions || [];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Manage Permissions</DialogTitle>
          <DialogDescription>View and manage permissions for {userName}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : error ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load permissions. Please try again.</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Superuser Status */}
            {data?.permissions.is_superuser && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  This user is a <strong>superuser</strong> and has all permissions implicitly.
                </AlertDescription>
              </Alert>
            )}

            {/* Add Permission Form */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Permission
              </h4>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label htmlFor="app">App</Label>
                  <Select value={selectedApp} onValueChange={setSelectedApp}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select app" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contracts">Contracts</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="catalog">Catalog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Select
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                    disabled={!selectedApp}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableModels().map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="permission">Permission</Label>
                  <Select
                    value={selectedPermission}
                    onValueChange={setSelectedPermission}
                    disabled={!selectedModel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select permission" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailablePermissions().map((perm) => (
                        <SelectItem key={perm} value={perm}>
                          {perm}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleAssignPermission}
                    disabled={
                      !selectedApp ||
                      !selectedModel ||
                      !selectedPermission ||
                      assignPermission.isPending
                    }
                    className="w-full"
                  >
                    {assignPermission.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Add'
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Group Permissions */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Permissions from Groups ({data?.permissions.from_groups.length || 0})
              </h4>
              {data?.permissions.from_groups.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No permissions inherited from groups
                </p>
              ) : (
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {data?.permissions.from_groups.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <div>
                          <code className="text-xs">{perm.codename}</code>
                          <p className="text-xs text-muted-foreground">{perm.name}</p>
                        </div>
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {perm.group}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            <Separator />

            {/* Direct Permissions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Direct Permissions ({data?.permissions.direct.length || 0})
                </h4>
                {data?.permissions.direct && data.permissions.direct.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveAllPermissions}
                    disabled={removePermission.isPending}
                  >
                    Remove All
                  </Button>
                )}
              </div>
              {data?.permissions.direct.length === 0 ? (
                <p className="text-sm text-muted-foreground">No direct permissions assigned</p>
              ) : (
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {data?.permissions.direct.map((perm) => {
                      // Parse permission to extract app_label and model
                      const parts = perm.codename.split('_');
                      const action = parts[0];
                      const model = parts.slice(1).join('_');
                      const appLabel = perm.name.toLowerCase().includes('contract')
                        ? 'contracts'
                        : perm.name.toLowerCase().includes('payment') ||
                          perm.name.toLowerCase().includes('royalty')
                        ? 'finance'
                        : 'catalog';

                      return (
                        <div
                          key={perm.id}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                        >
                          <div>
                            <code className="text-xs">{perm.codename}</code>
                            <p className="text-xs text-muted-foreground">{perm.name}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemovePermission(appLabel, model, perm.codename)
                            }
                            disabled={removePermission.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}