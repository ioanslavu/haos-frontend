import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Loader2, TrendingUp, TrendingDown, Minus, Edit, Save, X } from 'lucide-react';
import {
  useClientProfileByEntity,
  useCreateClientProfile,
  useUpdateClientProfile,
} from '@/api/hooks/useClientProfiles';
import type { ClientProfile } from '@/api/services/clientProfiles.service';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ClientHealthScoreProps {
  entityId: number | undefined | null;
  className?: string;
  // Optional: Pre-fetched data for parallel loading
  profile?: ClientProfile;
  isLoading?: boolean;
  // Optional: Override department (useful when called from campaign detail page)
  departmentId?: number | null;
}

export function ClientHealthScore({ entityId, className, profile: externalProfile, isLoading: externalLoading, departmentId: externalDepartmentId }: ClientHealthScoreProps) {
  const currentUser = useAuthStore((state) => state.user);
  const userDepartmentId = currentUser?.profile?.department?.id;

  // Use external department if provided, otherwise fall back to user's department
  const departmentId = externalDepartmentId ?? userDepartmentId;

  // Only fetch internally if no external data is provided
  const { data: internalProfile, isLoading: internalLoading } = useClientProfileByEntity(
    entityId,
    !!entityId && !externalProfile
  );

  // Use external data if provided, otherwise fall back to internal
  const profile = externalProfile ?? internalProfile;
  const isLoading = externalLoading ?? internalLoading;

  const createProfile = useCreateClientProfile();
  const updateProfile = useUpdateClientProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    health_score: 5,
    collaboration_frequency_score: 5,
    feedback_score: 5,
    payment_latency_score: 5,
    notes: '',
  });

  // Initialize form data when profile loads or when creating new
  useEffect(() => {
    if (profile) {
      setFormData({
        health_score: profile.health_score || 5,
        collaboration_frequency_score: profile.collaboration_frequency_score || 5,
        feedback_score: profile.feedback_score || 5,
        payment_latency_score: profile.payment_latency_score || 5,
        notes: profile.notes || '',
      });
      setIsEditing(false);
    } else if (entityId && !isLoading) {
      // No profile exists, start in edit mode
      setIsEditing(true);
    }
  }, [profile, entityId, isLoading]);

  if (!entityId) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Client Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number | null) => {
    if (!score) return 'bg-gray-500';
    if (score <= 3) return 'bg-red-500';
    if (score <= 6) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getScoreLabel = (score: number | null) => {
    if (!score) return 'Not Set';
    if (score <= 3) return 'Poor';
    if (score <= 6) return 'Fair';
    return 'Good';
  };

  const getTrendIcon = () => {
    if (!profile || profile.score_trend === 'stable') {
      return <Minus className="h-4 w-4" />;
    }
    if (profile.score_trend === 'up') {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    }
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const handleSave = async () => {
    if (!entityId) {
      toast.error('Missing client information');
      return;
    }
    if (!departmentId) {
      toast.error('Missing department information. Please ensure the campaign has a department assigned.');
      return;
    }

    try {
      if (profile) {
        // Update existing profile
        await updateProfile.mutateAsync({
          id: profile.id,
          data: formData,
        });
        toast.success('Client health score updated');
      } else {
        // Create new profile
        await createProfile.mutateAsync({
          entity: entityId,
          department: departmentId,
          ...formData,
        });
        toast.success('Client health score created');
      }
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save client health score');
    }
  };

  const handleCancel = () => {
    if (profile) {
      // Reset to original values
      setFormData({
        health_score: profile.health_score || 5,
        collaboration_frequency_score: profile.collaboration_frequency_score || 5,
        feedback_score: profile.feedback_score || 5,
        payment_latency_score: profile.payment_latency_score || 5,
        notes: profile.notes || '',
      });
      setIsEditing(false);
    } else {
      // Reset to defaults
      setFormData({
        health_score: 5,
        collaboration_frequency_score: 5,
        feedback_score: 5,
        payment_latency_score: 5,
        notes: '',
      });
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Client Health Score
              {profile && (
                <Badge
                  variant="secondary"
                  className={cn('ml-2', getScoreColor(profile.health_score))}
                >
                  {profile.health_score || 'N/A'}/10
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {profile
                ? 'Track client reliability based on collaboration, feedback, and payments'
                : 'Create a health score to track client reliability'}
            </CardDescription>
          </div>
          {!isEditing && profile && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isEditing && profile ? (
          // Display mode
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium mb-1">Overall Health</div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn('text-lg font-bold', getScoreColor(profile.health_score))}
                  >
                    {profile.health_score || 'N/A'}/10
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {getScoreLabel(profile.health_score)}
                  </span>
                  {getTrendIcon()}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Last Updated</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(profile.updated_at).toLocaleDateString()}
                  {profile.updated_by_name && (
                    <span className="block text-xs">by {profile.updated_by_name}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Collaboration Frequency</span>
                <Badge
                  variant="outline"
                  className={getScoreColor(profile.collaboration_frequency_score)}
                >
                  {profile.collaboration_frequency_score || 'N/A'}/10
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Feedback Quality</span>
                <Badge variant="outline" className={getScoreColor(profile.feedback_score)}>
                  {profile.feedback_score || 'N/A'}/10
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Payment Timeliness</span>
                <Badge variant="outline" className={getScoreColor(profile.payment_latency_score)}>
                  {profile.payment_latency_score || 'N/A'}/10
                </Badge>
              </div>
            </div>

            {profile.notes && (
              <div className="pt-2 border-t">
                <div className="text-sm font-medium mb-1">Notes</div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.notes}</p>
              </div>
            )}
          </>
        ) : (
          // Edit/Create mode
          <>
            <div className="space-y-4">
              <div>
                <Label>Overall Health Score: {formData.health_score}/10</Label>
                <Slider
                  value={[formData.health_score]}
                  onValueChange={(value) => setFormData({ ...formData, health_score: value[0] })}
                  min={1}
                  max={10}
                  step={1}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Rate the overall health of your relationship with this client
                </p>
              </div>

              <div>
                <Label>Collaboration Frequency: {formData.collaboration_frequency_score}/10</Label>
                <Slider
                  value={[formData.collaboration_frequency_score]}
                  onValueChange={(value) =>
                    setFormData({ ...formData, collaboration_frequency_score: value[0] })
                  }
                  min={1}
                  max={10}
                  step={1}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">How often do you work together?</p>
              </div>

              <div>
                <Label>Feedback Quality: {formData.feedback_score}/10</Label>
                <Slider
                  value={[formData.feedback_score]}
                  onValueChange={(value) => setFormData({ ...formData, feedback_score: value[0] })}
                  min={1}
                  max={10}
                  step={1}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Communication quality and responsiveness
                </p>
              </div>

              <div>
                <Label>Payment Timeliness: {formData.payment_latency_score}/10</Label>
                <Slider
                  value={[formData.payment_latency_score]}
                  onValueChange={(value) =>
                    setFormData({ ...formData, payment_latency_score: value[0] })
                  }
                  min={1}
                  max={10}
                  step={1}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Payment punctuality (10 = always on time)
                </p>
              </div>

              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any notes about this client's reliability..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-2 min-h-[80px]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={createProfile.isPending || updateProfile.isPending}
                size="sm"
              >
                {createProfile.isPending || updateProfile.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {profile ? 'Update' : 'Create'} Score
                  </>
                )}
              </Button>
              {profile && (
                <Button
                  onClick={handleCancel}
                  disabled={createProfile.isPending || updateProfile.isPending}
                  variant="ghost"
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
