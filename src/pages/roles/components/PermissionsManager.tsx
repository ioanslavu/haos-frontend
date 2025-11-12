import React, { useState, useMemo } from 'react';
import {
  useRole,
  useAvailablePermissions,
  useManageRolePermissions,
  useClearRolePermissions,
  Permission,
  GroupedPermissions,
} from '@/api/hooks/useRoles';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Key,
  Search,
  Save,
  RefreshCw,
  Trash2,
  AlertCircle,
  Info,
  Shield,
  Loader2,
  Package,
} from 'lucide-react';

interface PermissionsManagerProps {
  roleId: number;
}

export function PermissionsManager({ roleId }: PermissionsManagerProps) {
  // Use role detail to get permissions instead of separate API call
  const { data: roleDetail } = useRole(roleId);
  const rolePermissions = roleDetail?.permissions || [];
  const { data: availablePermissions, isLoading: loadingAvailable } = useAvailablePermissions();
  const loadingRole = !roleDetail;
  const managePermissions = useManageRolePermissions();
  const clearPermissions = useClearRolePermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize selected permissions when role permissions load
  React.useEffect(() => {
    if (rolePermissions) {
      setSelectedPermissions(new Set(rolePermissions.map(p => p.id)));
    }
  }, [rolePermissions]);

  // Track changes
  React.useEffect(() => {
    if (rolePermissions) {
      const currentIds = new Set(rolePermissions.map(p => p.id));
      const hasChanges = 
        selectedPermissions.size !== currentIds.size ||
        [...selectedPermissions].some(id => !currentIds.has(id));
      setHasChanges(hasChanges);
    }
  }, [selectedPermissions, rolePermissions]);

  const handlePermissionToggle = (permissionId: number) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const handleSelectAll = (permissions: Permission[]) => {
    const newSelected = new Set(selectedPermissions);
    permissions.forEach(p => newSelected.add(p.id));
    setSelectedPermissions(newSelected);
  };

  const handleDeselectAll = (permissions: Permission[]) => {
    const newSelected = new Set(selectedPermissions);
    permissions.forEach(p => newSelected.delete(p.id));
    setSelectedPermissions(newSelected);
  };

  const handleSave = async () => {
    await managePermissions.mutateAsync({
      roleId,
      payload: {
        action: 'set',
        permissions: Array.from(selectedPermissions),
      },
    });
    setHasChanges(false);
  };

  const handleClear = async () => {
    await clearPermissions.mutateAsync(roleId);
    setSelectedPermissions(new Set());
    setClearDialogOpen(false);
    setHasChanges(false);
  };

  const handleReset = () => {
    if (rolePermissions) {
      setSelectedPermissions(new Set(rolePermissions.map(p => p.id)));
      setHasChanges(false);
    }
  };

  // Filter permissions based on search
  const filteredGrouped = useMemo(() => {
    if (!availablePermissions?.grouped) return {};
    if (!searchQuery) return availablePermissions.grouped;

    const filtered: GroupedPermissions = {};
    const query = searchQuery.toLowerCase();

    Object.entries(availablePermissions.grouped).forEach(([appLabel, models]) => {
      const filteredModels: typeof models = {};
      
      Object.entries(models).forEach(([modelName, modelData]) => {
        const filteredPerms = modelData.permissions.filter(p =>
          p.name.toLowerCase().includes(query) ||
          p.codename.toLowerCase().includes(query) ||
          modelName.toLowerCase().includes(query) ||
          appLabel.toLowerCase().includes(query)
        );

        if (filteredPerms.length > 0) {
          filteredModels[modelName] = {
            ...modelData,
            permissions: filteredPerms,
          };
        }
      });

      if (Object.keys(filteredModels).length > 0) {
        filtered[appLabel] = filteredModels;
      }
    });

    return filtered;
  }, [availablePermissions, searchQuery]);

  if (loadingRole || loadingAvailable) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const getAppIcon = (appLabel: string) => {
    const icons: Record<string, React.ReactNode> = {
      auth: <Shield className="h-4 w-4" />,
      admin: <Shield className="h-4 w-4" />,
      contenttypes: <Package className="h-4 w-4" />,
      sessions: <Key className="h-4 w-4" />,
    };
    return icons[appLabel] || <Package className="h-4 w-4" />;
  };

  const getAppColor = (appLabel: string) => {
    const colors: Record<string, string> = {
      auth: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      catalog: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      finance: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      contracts: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };
    return colors[appLabel] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Management</CardTitle>
          <CardDescription>
            Select permissions to grant to this role. Changes are not saved until you click Save.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search permissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  Selected: <strong className="text-foreground">{selectedPermissions.size}</strong>
                </span>
                <span className="text-muted-foreground">
                  Total: <strong className="text-foreground">{availablePermissions?.count || 0}</strong>
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={!hasChanges}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setClearDialogOpen(true)}
                  disabled={selectedPermissions.size === 0}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || managePermissions.isPending}
                >
                  {managePermissions.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>

            {hasChanges && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You have unsaved changes. Click "Save Changes" to apply them.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Permissions List */}
      <Card>
        <CardContent className="pt-6">
          <ScrollArea className="h-[600px] pr-4">
            <Accordion type="multiple" className="space-y-4">
              {Object.entries(filteredGrouped).map(([appLabel, models]) => (
                <AccordionItem key={appLabel} value={appLabel}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        {getAppIcon(appLabel)}
                        <span className="font-medium capitalize">{appLabel.replace(/_/g, ' ')}</span>
                        <Badge variant="secondary" className={getAppColor(appLabel)}>
                          {Object.values(models).reduce((acc, m) => acc + m.permissions.length, 0)} permissions
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {Object.values(models).reduce((acc, m) => 
                          acc + m.permissions.filter(p => selectedPermissions.has(p.id)).length, 0
                        )} selected
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      {Object.entries(models).map(([modelName, modelData]) => (
                        <div key={modelName} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-base font-medium capitalize">
                              {modelData.model_name.replace(/_/g, ' ')}
                            </Label>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSelectAll(modelData.permissions)}
                              >
                                Select All
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeselectAll(modelData.permissions)}
                              >
                                Deselect All
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                            {modelData.permissions.map((permission) => (
                              <div key={permission.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`perm-${permission.id}`}
                                  checked={selectedPermissions.has(permission.id)}
                                  onCheckedChange={() => handlePermissionToggle(permission.id)}
                                />
                                <Label
                                  htmlFor={`perm-${permission.id}`}
                                  className="text-sm font-normal cursor-pointer flex-1"
                                >
                                  <div>
                                    <p>{permission.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {permission.codename}
                                    </p>
                                  </div>
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {Object.keys(filteredGrouped).length === 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No permissions found matching your search' : 'No permissions available'}
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Permissions</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove all permissions from this role? 
              This action can be undone by reassigning permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClear}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}