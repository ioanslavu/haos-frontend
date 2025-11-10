/**
 * Alert Settings Page
 *
 * Admin-only page for managing alert configurations.
 * Allows toggling alerts on/off and customizing:
 * - Days threshold
 * - Notification targets (assigned user, managers, creator)
 * - Priority level
 * - Message templates
 */

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Bell, Settings2, AlertCircle, Info, AlertTriangle, XCircle, Save, X } from 'lucide-react';
import { useAlertConfigurations, useUpdateAlertConfiguration, useToggleAlertConfiguration } from '@/api/hooks/useAlertConfigurations';
import { AlertConfiguration, AlertConfigurationUpdate, TEMPLATE_VARIABLES } from '@/types/alertConfiguration';

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return AlertCircle;
    case 'important':
      return AlertTriangle;
    case 'info':
      return Info;
    default:
      return Info;
  }
};

const getPriorityVariant = (priority: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (priority) {
    case 'urgent':
      return 'destructive';
    case 'important':
      return 'default';
    case 'info':
      return 'secondary';
    default:
      return 'secondary';
  }
};

interface EditDialogState {
  open: boolean;
  config: AlertConfiguration | null;
}

export default function AlertSettingsPage() {
  const { data: configurations, isLoading } = useAlertConfigurations();
  const updateMutation = useUpdateAlertConfiguration();
  const toggleMutation = useToggleAlertConfiguration();

  const [editDialog, setEditDialog] = useState<EditDialogState>({ open: false, config: null });
  const [formData, setFormData] = useState<AlertConfigurationUpdate>({});

  const handleToggle = (id: number, currentEnabled: boolean) => {
    toggleMutation.mutate({ id, enabled: !currentEnabled });
  };

  const handleEdit = (config: AlertConfiguration) => {
    setFormData({
      enabled: config.enabled,
      days_threshold: config.days_threshold,
      notify_assigned_user: config.notify_assigned_user,
      notify_department_managers: config.notify_department_managers,
      notify_song_creator: config.notify_song_creator,
      priority: config.priority,
      title_template: config.title_template,
      message_template: config.message_template,
    });
    setEditDialog({ open: true, config });
  };

  const handleSave = () => {
    if (!editDialog.config) return;

    updateMutation.mutate(
      { id: editDialog.config.id, data: formData },
      {
        onSuccess: () => {
          setEditDialog({ open: false, config: null });
          setFormData({});
        },
      }
    );
  };

  const handleCloseDialog = () => {
    setEditDialog({ open: false, config: null });
    setFormData({});
  };

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-400/30 to-pink-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <Bell className="h-10 w-10 text-blue-500" />
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Alert Configurations
                </h1>
                <p className="text-muted-foreground text-lg mt-2">
                  Manage workflow alerts for song deadlines, releases, and overdue items
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Info */}
        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-300">
            Alert configurations are applied system-wide. Changes take effect immediately and will be used by the daily alert task.
          </AlertDescription>
        </Alert>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Alert Configuration Cards */}
        {!isLoading && configurations && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {configurations.map((config) => {
              const PriorityIcon = getPriorityIcon(config.priority);

              return (
                <Card key={config.id} className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Bell className="h-5 w-5" />
                          {config.alert_type_display}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {config.schedule_description}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={config.enabled}
                          onCheckedChange={() => handleToggle(config.id, config.enabled)}
                          disabled={toggleMutation.isPending}
                        />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={config.enabled ? 'default' : 'secondary'}
                        className="gap-1"
                      >
                        {config.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Badge variant={getPriorityVariant(config.priority)} className="gap-1">
                        <PriorityIcon className="h-3 w-3" />
                        {config.priority_display}
                      </Badge>
                    </div>

                    {/* Threshold */}
                    {config.days_threshold !== null && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Threshold:</span>{' '}
                        <span className="font-medium">{config.days_threshold} days</span>
                      </div>
                    )}

                    {/* Notification Targets */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        Notifies:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {config.notify_assigned_user && (
                          <Badge variant="outline" className="text-xs">
                            Assigned User
                          </Badge>
                        )}
                        {config.notify_department_managers && (
                          <Badge variant="outline" className="text-xs">
                            Managers
                          </Badge>
                        )}
                        {config.notify_song_creator && (
                          <Badge variant="outline" className="text-xs">
                            Creator
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Message Preview */}
                    <div className="border-t pt-4">
                      <div className="text-xs text-muted-foreground mb-1">
                        Title Template:
                      </div>
                      <div className="text-sm font-mono bg-muted/50 p-2 rounded">
                        {config.title_template}
                      </div>
                    </div>

                    {/* Edit Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleEdit(config)}
                    >
                      <Settings2 className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialog.open} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Configure {editDialog.config?.alert_type_display}
              </DialogTitle>
              <DialogDescription>
                Customize alert behavior, notification targets, and message templates
              </DialogDescription>
            </DialogHeader>

            {editDialog.config && (
              <div className="space-y-6 py-4">
                {/* Enable/Disable */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enabled" className="text-base">Enable Alert</Label>
                    <p className="text-sm text-muted-foreground">
                      Turn this alert type on or off
                    </p>
                  </div>
                  <Switch
                    id="enabled"
                    checked={formData.enabled ?? editDialog.config.enabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, enabled: checked })
                    }
                  />
                </div>

                {/* Days Threshold */}
                {editDialog.config.alert_type !== 'overdue' && (
                  <div className="space-y-2">
                    <Label htmlFor="days_threshold">Days Threshold</Label>
                    <Input
                      id="days_threshold"
                      type="number"
                      min="1"
                      max="30"
                      value={formData.days_threshold ?? editDialog.config.days_threshold ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          days_threshold: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of days before the event to trigger this alert
                    </p>
                  </div>
                )}

                {/* Notification Targets */}
                <div className="space-y-3">
                  <Label className="text-base">Notification Targets</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notify_assigned_user"
                        checked={formData.notify_assigned_user ?? editDialog.config.notify_assigned_user}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, notify_assigned_user: checked as boolean })
                        }
                      />
                      <Label htmlFor="notify_assigned_user" className="font-normal cursor-pointer">
                        Notify Assigned User
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notify_department_managers"
                        checked={formData.notify_department_managers ?? editDialog.config.notify_department_managers}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, notify_department_managers: checked as boolean })
                        }
                      />
                      <Label htmlFor="notify_department_managers" className="font-normal cursor-pointer">
                        Notify Department Managers
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notify_song_creator"
                        checked={formData.notify_song_creator ?? editDialog.config.notify_song_creator}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, notify_song_creator: checked as boolean })
                        }
                      />
                      <Label htmlFor="notify_song_creator" className="font-normal cursor-pointer">
                        Notify Song Creator
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select
                    value={formData.priority ?? editDialog.config.priority}
                    onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Title Template */}
                <div className="space-y-2">
                  <Label htmlFor="title_template">Title Template</Label>
                  <Input
                    id="title_template"
                    value={formData.title_template ?? editDialog.config.title_template}
                    onChange={(e) =>
                      setFormData({ ...formData, title_template: e.target.value })
                    }
                    placeholder="e.g., OVERDUE: {song_title}"
                  />
                </div>

                {/* Message Template */}
                <div className="space-y-2">
                  <Label htmlFor="message_template">Message Template</Label>
                  <Textarea
                    id="message_template"
                    value={formData.message_template ?? editDialog.config.message_template}
                    onChange={(e) =>
                      setFormData({ ...formData, message_template: e.target.value })
                    }
                    rows={3}
                    placeholder="e.g., {song_title} is overdue in {stage} stage..."
                  />
                </div>

                {/* Template Variables Help */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="text-sm">
                      <div className="font-medium mb-2">Available Variables:</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {TEMPLATE_VARIABLES.map((variable) => (
                          <div key={variable.name} className="font-mono">
                            <span className="text-primary">{variable.name}</span>
                            <span className="text-muted-foreground"> - {variable.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
