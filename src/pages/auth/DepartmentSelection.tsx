import { useState, useEffect } from 'react';
import { Music, TrendingUp, Loader2, CheckCircle2, Clock, Mic, Briefcase, Scale, DollarSign, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateDepartmentRequest, useDepartmentRequests, useCancelDepartmentRequest } from '@/api/hooks/useUsers';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

type DepartmentType = 'digital' | 'sales' | 'publishing' | 'legal' | 'finance' | 'operations';

const AVAILABLE_DEPARTMENTS: DepartmentType[] = ['digital', 'sales', 'publishing'];
const HIDDEN_DEPARTMENTS: DepartmentType[] = ['legal', 'finance', 'operations']; // Prepared for future

export default function DepartmentSelection() {
  const user = useAuthStore((state) => state.user);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentType | null>(null);
  const [message, setMessage] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  const createRequestMutation = useCreateDepartmentRequest();
  const cancelRequestMutation = useCancelDepartmentRequest();
  const { data: requests, refetch } = useDepartmentRequests();

  // Check for existing pending request
  const pendingRequest = requests?.find((req) => req.status === 'pending');

  useEffect(() => {
    // Refetch requests when component mounts to get latest status
    refetch();
  }, [refetch]);

  const handleDepartmentSelect = (dept: DepartmentType) => {
    setSelectedDepartment(dept);
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!selectedDepartment) return;

    try {
      await createRequestMutation.mutateAsync({
        requested_department: selectedDepartment,
        message,
      });
      setShowDialog(false);
      setMessage('');
      setSelectedDepartment(null);
      refetch(); // Refresh to show pending request
    } catch (error) {
      console.error('Request failed:', error);
    }
  };

  const handleChangeRequest = async () => {
    // Cancel the pending request so user can select a different department
    if (pendingRequest) {
      try {
        await cancelRequestMutation.mutateAsync(pendingRequest.id);
        refetch(); // Refresh to hide pending request screen
      } catch (error) {
        console.error('Cancel failed:', error);
      }
    }
  };

  // If user already has pending request, show waiting screen
  if (pendingRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/30 dark:from-slate-900 dark:via-amber-900/20 dark:to-slate-900 p-4 relative overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-yellow-400/20 to-red-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="w-full max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
          <Card className="p-8 text-center space-y-6 backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-2xl rounded-3xl">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4 mx-auto">
              <Clock className="h-10 w-10 text-primary animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Request Pending</h2>
              <p className="text-muted-foreground">
                Your request to join the{' '}
                <span className="font-medium text-foreground capitalize">
                  {pendingRequest.requested_department}
                </span>{' '}
                department is being reviewed.
              </p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
              <p className="font-medium">What's Next?</p>
              <p className="text-muted-foreground">
                A manager will review your request shortly. You'll be notified once it's approved.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={handleChangeRequest}
              className="w-full"
              disabled={cancelRequestMutation.isPending}
            >
              {cancelRequestMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Canceling...
                </>
              ) : (
                'Request Different Department'
              )}
            </Button>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Need help? Contact your administrator
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-slate-900 dark:via-indigo-900/20 dark:to-slate-900 p-4 relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-indigo-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-400/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-5xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Choose Your Department</h1>
          <p className="text-muted-foreground text-lg">
            Select the department that matches your role at HaHaHa Production
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary/50"></div>
          <div className="h-1 w-12 rounded-full bg-primary/50"></div>
          <div className="h-2 w-2 rounded-full bg-primary"></div>
          <div className="h-1 w-12 rounded-full bg-primary"></div>
          <div className="h-2 w-2 rounded-full bg-muted"></div>
        </div>
        <p className="text-center text-xs text-muted-foreground">Step 2 of 2</p>

        {/* Department Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Digital Department */}
          <Card
            className={cn(
              'group relative overflow-hidden backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl transition-all duration-300 cursor-pointer hover:shadow-2xl hover:scale-[1.02] rounded-3xl'
            )}
            onClick={() => handleDepartmentSelect('digital')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />

            <CardHeader className="relative space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm group-hover:scale-110 transition-transform shadow-lg">
                <Music className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl font-bold">Digital</CardTitle>
              <CardDescription className="text-base">
                Marketing, streaming platforms, social media, and digital content management
              </CardDescription>
            </CardHeader>

            <CardContent className="relative space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  Digital Marketing Campaigns
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  Streaming Platform Management
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  Social Media & Content
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sales Department */}
          <Card
            className={cn(
              'group relative overflow-hidden backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl transition-all duration-300 cursor-pointer hover:shadow-2xl hover:scale-[1.02] rounded-3xl'
            )}
            onClick={() => handleDepartmentSelect('sales')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />

            <CardHeader className="relative space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm group-hover:scale-110 transition-transform shadow-lg">
                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl font-bold">Sales</CardTitle>
              <CardDescription className="text-base">
                Client relationships, partnerships, contracts, and revenue growth
              </CardDescription>
            </CardHeader>

            <CardContent className="relative space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Client Relationship Management
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Partnership Development
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Contract Negotiations
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Publishing/Production Department */}
          <Card
            className={cn(
              'group relative overflow-hidden backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl transition-all duration-300 cursor-pointer hover:shadow-2xl hover:scale-[1.02] rounded-3xl'
            )}
            onClick={() => handleDepartmentSelect('publishing')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />

            <CardHeader className="relative space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm group-hover:scale-110 transition-transform shadow-lg">
                <Mic className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-2xl font-bold">Publishing/Production</CardTitle>
              <CardDescription className="text-base">
                Music publishing, catalog management, and production operations
              </CardDescription>
            </CardHeader>

            <CardContent className="relative space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-500" />
                  Publishing Rights Management
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-500" />
                  Catalog Administration
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-500" />
                  Production Coordination
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Selected the wrong department? You can request a change later
        </p>
      </div>

      {/* Request Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Request Access to{' '}
              <span className="capitalize">{selectedDepartment}</span> Department
            </DialogTitle>
            <DialogDescription>
              Your request will be reviewed by a manager. You'll be notified once it's approved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Tell us why you're requesting access to this department..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Adding a message can help speed up the approval process
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="flex-1"
              disabled={createRequestMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={createRequestMutation.isPending}
            >
              {createRequestMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
