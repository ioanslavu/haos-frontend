import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  ExternalLink,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  RefreshCw,
  CreditCard,
  Loader2,
  Cloud,
  Calendar,
  Building2,
  User,
  Hash,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  useInvoice,
  useMarkInvoicePaid,
  useCancelInvoice,
  useAcceptExtraction,
  useRetryExtraction,
  useSyncToGdrive,
  useUploadInvoiceFile,
} from '@/api/hooks/useInvoices';
import { useToast } from '@/hooks/use-toast';
import { InvoiceStatusBadge } from './components/InvoiceStatusBadge';
import { InvoiceTypeBadge } from './components/InvoiceTypeBadge';
import { ExtractionStatusBadge } from './components/ExtractionStatusBadge';
import { format } from 'date-fns';

const currencySymbols: Record<string, string> = {
  EUR: '\u20AC',
  USD: '$',
  GBP: '\u00A3',
  RON: 'RON',
};

function formatAmount(amount: string | null, currency: string): string {
  if (!amount) return '-';
  const num = parseFloat(amount);
  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const invoiceId = parseInt(id || '0');

  const [activeTab, setActiveTab] = useState('overview');
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');

  const { data: invoice, isLoading, error } = useInvoice(invoiceId);

  const markPaidMutation = useMarkInvoicePaid();
  const cancelMutation = useCancelInvoice();
  const acceptExtractionMutation = useAcceptExtraction();
  const retryExtractionMutation = useRetryExtraction();
  const syncToGdriveMutation = useSyncToGdrive();
  const uploadFileMutation = useUploadInvoiceFile();

  const handleMarkPaid = async () => {
    try {
      await markPaidMutation.mutateAsync({
        id: invoiceId,
        payload: paymentReference ? { payment_reference: paymentReference } : undefined,
      });
      toast({ title: 'Invoice marked as paid', description: 'The invoice status has been updated.' });
      setShowMarkPaidDialog(false);
      setPaymentReference('');
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to mark invoice as paid.', variant: 'destructive' });
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(invoiceId);
      toast({ title: 'Invoice cancelled', description: 'The invoice has been cancelled.' });
      setShowCancelDialog(false);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to cancel invoice.', variant: 'destructive' });
    }
  };

  const handleAcceptExtraction = async () => {
    try {
      await acceptExtractionMutation.mutateAsync(invoiceId);
      toast({ title: 'Extraction accepted', description: 'The extracted amount has been applied.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to accept extraction.', variant: 'destructive' });
    }
  };

  const handleRetryExtraction = async () => {
    try {
      await retryExtractionMutation.mutateAsync(invoiceId);
      toast({ title: 'Extraction started', description: 'AI extraction has been restarted.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to retry extraction.', variant: 'destructive' });
    }
  };

  const handleSyncToGdrive = async () => {
    try {
      await syncToGdriveMutation.mutateAsync(invoiceId);
      toast({ title: 'Sync started', description: 'File is being synced to Google Drive.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to sync to Google Drive.', variant: 'destructive' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadFileMutation.mutateAsync({ id: invoiceId, file });
      toast({ title: 'File uploaded', description: 'Invoice file has been uploaded and AI extraction started.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to upload file.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  if (error || !invoice) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Failed to load invoice details.</p>
          <Button onClick={() => navigate('/invoices')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </div>
      </AppLayout>
    );
  }

  const canMarkPaid = invoice.status === 'uploaded' && invoice.amount;
  const canCancel = invoice.status !== 'paid' && invoice.status !== 'cancelled';
  const canUploadFile = !invoice.has_file;
  const canSyncToGdrive = invoice.has_file && !invoice.is_synced_to_gdrive;

  return (
    <AppLayout>
      <div className="space-y-6 pb-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/invoices')}
          className="gap-2 hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Invoices
        </Button>

        {/* Header Card */}
        <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold font-mono">{invoice.invoice_number}</h1>
                  <InvoiceTypeBadge type={invoice.invoice_type} />
                  <InvoiceStatusBadge status={invoice.status} />
                </div>
                <CardDescription className="text-lg">{invoice.name}</CardDescription>
                <p className="text-sm text-muted-foreground">
                  Created by {invoice.created_by_name || invoice.created_by_email || 'Unknown'} on{' '}
                  {format(new Date(invoice.created_at), 'PPP')}
                </p>
              </div>

              {/* Amount Display */}
              <div className="text-right">
                {invoice.amount ? (
                  <div className={`text-3xl font-bold ${invoice.is_income ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {invoice.is_income ? '+' : '-'}
                    {formatAmount(invoice.amount, invoice.currency)}
                  </div>
                ) : (
                  <div className="text-xl text-muted-foreground italic">Amount pending</div>
                )}
                <p className="text-sm text-muted-foreground mt-1">{invoice.currency_display}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {canMarkPaid && (
                <Button onClick={() => setShowMarkPaidDialog(true)} className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  Mark as Paid
                </Button>
              )}
              {canCancel && (
                <Button variant="outline" onClick={() => setShowCancelDialog(true)} className="gap-2">
                  <XCircle className="h-4 w-4" />
                  Cancel
                </Button>
              )}
              {canUploadFile && (
                <Button variant="outline" className="gap-2" asChild>
                  <label>
                    <Upload className="h-4 w-4" />
                    Upload File
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
                      onChange={handleFileUpload}
                    />
                  </label>
                </Button>
              )}
              {canSyncToGdrive && (
                <Button
                  variant="outline"
                  onClick={handleSyncToGdrive}
                  disabled={syncToGdriveMutation.isPending}
                  className="gap-2"
                >
                  {syncToGdriveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Cloud className="h-4 w-4" />
                  )}
                  Sync to Drive
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="rounded-xl bg-background/50 border border-white/10 p-1">
            <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
            <TabsTrigger value="file" className="rounded-lg">File & Extraction</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Financial Details */}
              <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Financial Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">{formatAmount(invoice.amount, invoice.currency)}</span>
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency</span>
                    <span>{invoice.currency_display}</span>
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Reference</span>
                    <span className="font-mono text-sm">{invoice.payment_reference || '-'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Dates */}
              <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span>{format(new Date(invoice.created_at), 'PPP')}</span>
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uploaded</span>
                    <span>{invoice.date_uploaded ? format(new Date(invoice.date_uploaded), 'PPP') : '-'}</span>
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid</span>
                    <span>{invoice.date_paid ? format(new Date(invoice.date_paid), 'PPP') : '-'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Relationships */}
              <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Relationships
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Department</span>
                    <span>{invoice.department_name}</span>
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contract</span>
                    <span className="font-mono text-sm">{invoice.contract_number || '-'}</span>
                  </div>
                  {invoice.contract_title && (
                    <>
                      <Separator className="bg-white/10" />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Contract Title</span>
                        <span className="text-sm truncate max-w-[200px]">{invoice.contract_title}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Storage */}
              <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Storage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">File</span>
                    {invoice.has_file ? (
                      <Button variant="outline" size="sm" asChild className="gap-2">
                        <a href={invoice.file || '#'} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                          Download
                        </a>
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">No file</span>
                    )}
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Google Drive</span>
                    {invoice.is_synced_to_gdrive && invoice.gdrive_file_url ? (
                      <Button variant="outline" size="sm" asChild className="gap-2">
                        <a href={invoice.gdrive_file_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          Open in Drive
                        </a>
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not synced</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* File & Extraction Tab */}
          <TabsContent value="file" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* File Preview */}
              <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Invoice File
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {invoice.has_file ? (
                    <div className="space-y-4">
                      <div className="aspect-[4/3] bg-muted/50 rounded-xl flex items-center justify-center border border-white/10">
                        {invoice.file?.endsWith('.pdf') ? (
                          <div className="text-center">
                            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">PDF Document</p>
                          </div>
                        ) : (
                          <img
                            src={invoice.file || ''}
                            alt="Invoice"
                            className="max-h-full max-w-full object-contain rounded-lg"
                          />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" asChild className="flex-1 gap-2">
                          <a href={invoice.file || '#'} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                            Open
                          </a>
                        </Button>
                        <Button variant="outline" asChild className="flex-1 gap-2">
                          <a href={invoice.file || '#'} download>
                            <Download className="h-4 w-4" />
                            Download
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No file uploaded yet</p>
                      <Button variant="outline" asChild>
                        <label className="cursor-pointer">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload File
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
                            onChange={handleFileUpload}
                          />
                        </label>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Extraction */}
              <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    AI Extraction
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <ExtractionStatusBadge status={invoice.extraction_status} />
                  </div>

                  {invoice.has_extraction && (
                    <>
                      <Separator className="bg-white/10" />

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Extracted Amount</span>
                        <span className="font-medium">
                          {formatAmount(invoice.extracted_amount, invoice.extracted_currency || invoice.currency)}
                        </span>
                      </div>

                      {invoice.extraction_confidence !== null && (
                        <>
                          <Separator className="bg-white/10" />
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Confidence</span>
                            <Badge variant="outline" className="font-mono">
                              {Math.round((invoice.extraction_confidence || 0) * 100)}%
                            </Badge>
                          </div>
                        </>
                      )}

                      {invoice.extraction_model && (
                        <>
                          <Separator className="bg-white/10" />
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Model</span>
                            <span className="text-sm font-mono text-muted-foreground">
                              {invoice.extraction_model}
                            </span>
                          </div>
                        </>
                      )}

                      {invoice.extraction_notes && (
                        <>
                          <Separator className="bg-white/10" />
                          <div>
                            <span className="text-muted-foreground text-sm">Notes</span>
                            <p className="text-sm mt-1">{invoice.extraction_notes}</p>
                          </div>
                        </>
                      )}

                      {invoice.extracted_at && (
                        <>
                          <Separator className="bg-white/10" />
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Extracted At</span>
                            <span className="text-sm">
                              {format(new Date(invoice.extracted_at), 'PPp')}
                            </span>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* Extraction Actions */}
                  <div className="flex flex-wrap gap-2 pt-4">
                    {invoice.extraction_successful && invoice.needs_manual_amount && (
                      <Button
                        onClick={handleAcceptExtraction}
                        disabled={acceptExtractionMutation.isPending}
                        className="gap-2"
                      >
                        {acceptExtractionMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Accept Extraction
                      </Button>
                    )}
                    {invoice.has_file && (invoice.extraction_status === 'failed' || invoice.extraction_status === 'success') && (
                      <Button
                        variant="outline"
                        onClick={handleRetryExtraction}
                        disabled={retryExtractionMutation.isPending}
                        className="gap-2"
                      >
                        {retryExtractionMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Retry Extraction
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Mark Paid Dialog */}
      <Dialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Mark Invoice as Paid</DialogTitle>
            <DialogDescription>
              This will update the invoice status to paid and record the payment date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment-reference">Payment Reference (Optional)</Label>
              <Input
                id="payment-reference"
                placeholder="Transaction ID, check number, etc."
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMarkPaidDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkPaid} disabled={markPaidMutation.isPending}>
              {markPaidMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mark as Paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this invoice? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, cancel invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
