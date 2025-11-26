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
  Sparkles,
  Link2,
  Megaphone,
  Target,
  Share2,
} from 'lucide-react';
import { PLATFORM_ICONS, PLATFORM_COLORS } from '@/lib/platform-icons';
import type { Platform } from '@/types/campaign';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { PDFViewer } from '@/components/ui/pdf-viewer';
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
            <TabsTrigger value="origins" className="rounded-lg">
              Origins
              {invoice.has_origins && (
                <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0">
                  {invoice.origin_count}
                </Badge>
              )}
            </TabsTrigger>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
                      {/* File Preview */}
                      {invoice.file?.toLowerCase().endsWith('.pdf') ? (
                        // PDF Preview using react-pdf
                        <PDFViewer url={invoice.file} />
                      ) : (
                        // Image Preview
                        <div className="aspect-[4/3] bg-muted/50 rounded-xl flex items-center justify-center border border-white/10 overflow-hidden">
                          <img
                            src={invoice.file || ''}
                            alt="Invoice"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      )}
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

            {/* Extracted Invoice Data - Full Details */}
            {invoice.extraction_successful && (
              <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Extracted Invoice Data
                    </CardTitle>
                    <Badge variant="outline" className="font-mono">
                      {Math.round((invoice.extraction_confidence || 0) * 100)}% confidence
                    </Badge>
                  </div>
                  <CardDescription>
                    Data automatically extracted by AI from the invoice file
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Invoice Details */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                        Invoice Details
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Invoice Number</span>
                          <span className="font-mono text-sm">{invoice.extracted_invoice_number || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Invoice Date</span>
                          <span className="text-sm">
                            {invoice.extracted_invoice_date
                              ? format(new Date(invoice.extracted_invoice_date), 'PPP')
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Due Date</span>
                          <span className="text-sm">
                            {invoice.extracted_due_date
                              ? format(new Date(invoice.extracted_due_date), 'PPP')
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Payment Terms</span>
                          <span className="text-sm">{invoice.extracted_payment_terms || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Vendor Info */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                        Vendor Information
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-muted-foreground text-sm block">Company</span>
                          <span className="text-sm font-medium">{invoice.extracted_vendor_name || '-'}</span>
                        </div>
                        {invoice.extracted_vendor_address && (
                          <div>
                            <span className="text-muted-foreground text-sm block">Address</span>
                            <span className="text-sm whitespace-pre-line">{invoice.extracted_vendor_address}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">VAT ID</span>
                          <span className="font-mono text-sm">{invoice.extracted_vendor_vat || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Country</span>
                          <span className="text-sm">{invoice.extracted_vendor_country || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Breakdown */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                        Financial Breakdown
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Subtotal</span>
                          <span className="font-mono text-sm">
                            {invoice.extracted_subtotal
                              ? formatAmount(invoice.extracted_subtotal, invoice.extracted_currency || invoice.currency)
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Tax Rate</span>
                          <span className="text-sm">
                            {invoice.extracted_tax_rate ? `${invoice.extracted_tax_rate}%` : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Tax Amount</span>
                          <span className="font-mono text-sm">
                            {invoice.extracted_tax_amount
                              ? formatAmount(invoice.extracted_tax_amount, invoice.extracted_currency || invoice.currency)
                              : '-'}
                          </span>
                        </div>
                        <Separator className="bg-white/10" />
                        <div className="flex justify-between font-medium">
                          <span>Total</span>
                          <span className="font-mono">
                            {formatAmount(invoice.extracted_amount, invoice.extracted_currency || invoice.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  {(invoice.extracted_iban || invoice.extracted_bank_name || invoice.extracted_payment_ref) && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-4">
                        Payment Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {invoice.extracted_iban && (
                          <div>
                            <span className="text-muted-foreground text-sm block">IBAN</span>
                            <span className="font-mono text-sm">{invoice.extracted_iban}</span>
                          </div>
                        )}
                        {invoice.extracted_bank_name && (
                          <div>
                            <span className="text-muted-foreground text-sm block">Bank</span>
                            <span className="text-sm">{invoice.extracted_bank_name}</span>
                          </div>
                        )}
                        {invoice.extracted_payment_ref && (
                          <div>
                            <span className="text-muted-foreground text-sm block">Payment Reference</span>
                            <span className="font-mono text-sm">{invoice.extracted_payment_ref}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Line Items */}
                  {invoice.extracted_line_items && invoice.extracted_line_items.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-4">
                        Line Items ({invoice.extracted_line_items.length})
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-left py-2 text-muted-foreground font-medium">Description</th>
                              <th className="text-right py-2 text-muted-foreground font-medium w-20">Qty</th>
                              <th className="text-right py-2 text-muted-foreground font-medium w-28">Unit Price</th>
                              <th className="text-right py-2 text-muted-foreground font-medium w-28">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoice.extracted_line_items.map((item, idx) => (
                              <tr key={idx} className="border-b border-white/5">
                                <td className="py-2">{item.description || '-'}</td>
                                <td className="text-right py-2 font-mono">{item.quantity || '1'}</td>
                                <td className="text-right py-2 font-mono">
                                  {item.unit_price
                                    ? formatAmount(item.unit_price, invoice.extracted_currency || invoice.currency)
                                    : '-'}
                                </td>
                                <td className="text-right py-2 font-mono">
                                  {item.total
                                    ? formatAmount(item.total, invoice.extracted_currency || invoice.currency)
                                    : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Origins Tab */}
          <TabsContent value="origins" className="mt-6">
            {invoice.has_origins ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {invoice.origins.map((origin, index) => (
                  <Card
                    key={`${origin.origin_type}-${origin.source_id}-${index}`}
                    className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl hover:bg-background/70 transition-colors"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        {/* Icon based on origin type, with platform icon for subcampaigns */}
                        {origin.origin_type === 'subcampaign' && origin.extra?.platform ? (
                          (() => {
                            const platform = origin.extra?.platform as Platform;
                            const Icon = PLATFORM_ICONS[platform];
                            const brandColor = PLATFORM_COLORS[platform];
                            return (
                              <div className={`p-2 rounded-lg ${brandColor?.split(' ').slice(1).join(' ') || 'bg-blue-500/10'}`}>
                                <Icon className={`h-5 w-5 ${brandColor?.split(' ')[0] || 'text-blue-500'}`} />
                              </div>
                            );
                          })()
                        ) : (
                          <div className={`p-2 rounded-lg ${
                            origin.origin_type === 'campaign'
                              ? 'bg-violet-500/10 text-violet-500'
                              : origin.origin_type === 'distribution'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-blue-500/10 text-blue-500'
                          }`}>
                            {origin.origin_type === 'campaign' ? (
                              <Megaphone className="h-5 w-5" />
                            ) : origin.origin_type === 'distribution' ? (
                              <Share2 className="h-5 w-5" />
                            ) : (
                              <Target className="h-5 w-5" />
                            )}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base truncate">
                            {origin.display_name}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground capitalize">
                            {origin.origin_type}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Status badge - campaigns */}
                      {origin.extra?.status_display && origin.origin_type !== 'distribution' && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Status</span>
                          <Badge variant="outline" className="text-xs">
                            {origin.extra.status_display}
                          </Badge>
                        </div>
                      )}

                      {/* Status badge - distributions */}
                      {origin.extra?.deal_status_display && origin.origin_type === 'distribution' && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Status</span>
                          <Badge variant="outline" className="text-xs">
                            {origin.extra.deal_status_display}
                          </Badge>
                        </div>
                      )}

                      {/* Deal type for distributions */}
                      {origin.extra?.deal_type_display && origin.origin_type === 'distribution' && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Deal Type</span>
                          <span>{origin.extra.deal_type_display}</span>
                        </div>
                      )}

                      {/* Revenue share for distributions */}
                      {origin.extra?.revenue_share && origin.origin_type === 'distribution' && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Revenue Share</span>
                          <span className="font-medium">{origin.extra.revenue_share}%</span>
                        </div>
                      )}

                      {/* Entity name */}
                      {origin.extra?.entity_name && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Entity</span>
                          <span className="truncate max-w-[150px]">{origin.extra.entity_name}</span>
                        </div>
                      )}

                      {/* Platform for subcampaigns */}
                      {origin.extra?.platform && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Platform</span>
                          <span className="flex items-center gap-2">
                            {(() => {
                              const platform = origin.extra?.platform as Platform;
                              const Icon = PLATFORM_ICONS[platform];
                              const brandColor = PLATFORM_COLORS[platform];
                              if (Icon) {
                                return (
                                  <Icon className={`h-4 w-4 ${brandColor?.split(' ')[0] || 'text-muted-foreground'}`} />
                                );
                              }
                              return null;
                            })()}
                            {origin.extra?.platform_display}
                          </span>
                        </div>
                      )}

                      {/* Parent campaign for subcampaigns */}
                      {origin.extra?.campaign_name && origin.origin_type === 'subcampaign' && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Campaign</span>
                          <span className="truncate max-w-[150px]">{origin.extra.campaign_name}</span>
                        </div>
                      )}

                      {/* Contract for distributions */}
                      {origin.extra?.contract_number && origin.origin_type === 'distribution' && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Contract</span>
                          <span className="font-mono text-xs">{origin.extra.contract_number}</span>
                        </div>
                      )}

                      {/* Linked info */}
                      {origin.extra?.linked_at && (
                        <div className="text-xs text-muted-foreground pt-2 border-t border-white/10">
                          Linked {format(new Date(origin.extra.linked_at), 'PPp')}
                          {origin.extra.linked_by && (
                            <span> by {origin.extra.linked_by}</span>
                          )}
                        </div>
                      )}

                      {/* View link */}
                      {origin.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2 gap-2"
                          onClick={() => navigate(origin.url!)}
                        >
                          <ExternalLink className="h-4 w-4" />
                          View {origin.origin_type === 'campaign' ? 'Campaign' : origin.origin_type === 'distribution' ? 'Distribution' : 'SubCampaign'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl">
                <CardContent className="py-12">
                  <div className="text-center">
                    <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Origins Linked</h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      This invoice is not linked to any campaigns, subcampaigns, or distributions.
                      Origins are added when invoices are associated with marketing activities or distribution deals.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
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
