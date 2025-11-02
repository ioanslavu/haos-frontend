import { useEffect, useState } from 'react';
import { Bell, Moon, Volume2, VolumeX } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/api/hooks/useNotifications';
import { toast } from 'sonner';

export function NotificationSettings() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  // Form state
  const [deadlineTomorrow, setDeadlineTomorrow] = useState(true);
  const [deadlineUrgent, setDeadlineUrgent] = useState(true);
  const [taskInactivity, setTaskInactivity] = useState(true);
  const [taskOverdue, setTaskOverdue] = useState(true);
  const [campaignEnding, setCampaignEnding] = useState(true);
  const [urgentHours, setUrgentHours] = useState(4);
  const [inactivityDays, setInactivityDays] = useState(7);
  const [campaignDays, setCampaignDays] = useState(7);
  const [quietHours, setQuietHours] = useState<'none' | 'evening' | 'night' | 'weekend' | 'custom'>('none');
  const [quietStart, setQuietStart] = useState('');
  const [quietEnd, setQuietEnd] = useState('');
  const [muteAll, setMuteAll] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form with fetched preferences
  useEffect(() => {
    if (preferences) {
      setDeadlineTomorrow(preferences.deadline_tomorrow_enabled);
      setDeadlineUrgent(preferences.deadline_urgent_enabled);
      setTaskInactivity(preferences.task_inactivity_enabled);
      setTaskOverdue(preferences.task_overdue_enabled);
      setCampaignEnding(preferences.campaign_ending_enabled);
      setUrgentHours(preferences.urgent_deadline_hours);
      setInactivityDays(preferences.inactivity_days);
      setCampaignDays(preferences.campaign_ending_days);
      setQuietHours(preferences.quiet_hours);
      setQuietStart(preferences.quiet_hours_start || '');
      setQuietEnd(preferences.quiet_hours_end || '');
      setMuteAll(preferences.mute_all_alerts);
    }
  }, [preferences]);

  const handleSave = async () => {
    try {
      await updatePreferences.mutateAsync({
        deadline_tomorrow_enabled: deadlineTomorrow,
        deadline_urgent_enabled: deadlineUrgent,
        task_inactivity_enabled: taskInactivity,
        task_overdue_enabled: taskOverdue,
        campaign_ending_enabled: campaignEnding,
        urgent_deadline_hours: urgentHours,
        inactivity_days: inactivityDays,
        campaign_ending_days: campaignDays,
        quiet_hours: quietHours,
        quiet_hours_start: quietStart || null,
        quiet_hours_end: quietEnd || null,
        mute_all_alerts: muteAll,
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  };

  const markChanged = () => setHasChanges(true);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mute All Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {muteAll ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            Quick Controls
          </CardTitle>
          <CardDescription>
            Temporarily disable all notification alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="mute-all">Mute All Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Pause all automated notification alerts
              </p>
            </div>
            <Switch
              id="mute-all"
              checked={muteAll}
              onCheckedChange={(checked) => {
                setMuteAll(checked);
                markChanged();
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Alert Types Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alert Types
          </CardTitle>
          <CardDescription>
            Choose which alerts you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tasks Due Tomorrow */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="deadline-tomorrow">Tasks Due Tomorrow</Label>
                <p className="text-sm text-muted-foreground">
                  Daily notification for tasks due within 24 hours
                </p>
              </div>
              <Switch
                id="deadline-tomorrow"
                checked={deadlineTomorrow}
                onCheckedChange={(checked) => {
                  setDeadlineTomorrow(checked);
                  markChanged();
                }}
                disabled={muteAll}
              />
            </div>
          </div>

          {/* Urgent Deadline */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="deadline-urgent">Urgent Task Deadline</Label>
                <p className="text-sm text-muted-foreground">
                  Alert when tasks are due soon
                </p>
              </div>
              <Switch
                id="deadline-urgent"
                checked={deadlineUrgent}
                onCheckedChange={(checked) => {
                  setDeadlineUrgent(checked);
                  markChanged();
                }}
                disabled={muteAll}
              />
            </div>
            {deadlineUrgent && !muteAll && (
              <div className="ml-4 space-y-2">
                <Label htmlFor="urgent-hours">Alert when due within (hours)</Label>
                <Input
                  id="urgent-hours"
                  type="number"
                  min={1}
                  max={24}
                  value={urgentHours}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value >= 1 && value <= 24) {
                      setUrgentHours(value);
                      markChanged();
                    }
                  }}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">Between 1-24 hours</p>
              </div>
            )}
          </div>

          {/* Task Inactivity */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="task-inactivity">Inactive Tasks</Label>
                <p className="text-sm text-muted-foreground">
                  Alert for tasks without updates
                </p>
              </div>
              <Switch
                id="task-inactivity"
                checked={taskInactivity}
                onCheckedChange={(checked) => {
                  setTaskInactivity(checked);
                  markChanged();
                }}
                disabled={muteAll}
              />
            </div>
            {taskInactivity && !muteAll && (
              <div className="ml-4 space-y-2">
                <Label htmlFor="inactivity-days">Alert after (days without update)</Label>
                <Input
                  id="inactivity-days"
                  type="number"
                  min={1}
                  max={30}
                  value={inactivityDays}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value >= 1 && value <= 30) {
                      setInactivityDays(value);
                      markChanged();
                    }
                  }}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">Between 1-30 days</p>
              </div>
            )}
          </div>

          {/* Overdue Tasks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="task-overdue">Overdue Tasks</Label>
                <p className="text-sm text-muted-foreground">
                  Alert for tasks past their due date
                </p>
              </div>
              <Switch
                id="task-overdue"
                checked={taskOverdue}
                onCheckedChange={(checked) => {
                  setTaskOverdue(checked);
                  markChanged();
                }}
                disabled={muteAll}
              />
            </div>
          </div>

          {/* Campaign Ending */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="campaign-ending">Campaigns Ending Soon</Label>
                <p className="text-sm text-muted-foreground">
                  Alert for campaigns approaching end date
                </p>
              </div>
              <Switch
                id="campaign-ending"
                checked={campaignEnding}
                onCheckedChange={(checked) => {
                  setCampaignEnding(checked);
                  markChanged();
                }}
                disabled={muteAll}
              />
            </div>
            {campaignEnding && !muteAll && (
              <div className="ml-4 space-y-2">
                <Label htmlFor="campaign-days">Alert when ending within (days)</Label>
                <Input
                  id="campaign-days"
                  type="number"
                  min={1}
                  max={30}
                  value={campaignDays}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value >= 1 && value <= 30) {
                      setCampaignDays(value);
                      markChanged();
                    }
                  }}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">Between 1-30 days</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Pause non-urgent notifications during specific times
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quiet-hours">Quiet Hours Schedule</Label>
            <Select
              value={quietHours}
              onValueChange={(value: any) => {
                setQuietHours(value);
                markChanged();
              }}
            >
              <SelectTrigger id="quiet-hours">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Quiet Hours</SelectItem>
                <SelectItem value="evening">Evening (6 PM - 9 AM)</SelectItem>
                <SelectItem value="night">Night (8 PM - 8 AM)</SelectItem>
                <SelectItem value="weekend">Weekends</SelectItem>
                <SelectItem value="custom">Custom Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {quietHours === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quiet-start">Start Time</Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={quietStart}
                  onChange={(e) => {
                    setQuietStart(e.target.value);
                    markChanged();
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-end">End Time</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={quietEnd}
                  onChange={(e) => {
                    setQuietEnd(e.target.value);
                    markChanged();
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updatePreferences.isPending}>
            {updatePreferences.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
