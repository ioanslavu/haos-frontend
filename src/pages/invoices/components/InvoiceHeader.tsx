/**
 * InvoiceHeader - Header card with status, amount, and action buttons
 */

import {
  ArrowLeft,
  Cloud,
  CreditCard,
  Loader2,
  Upload,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card'
import { InvoiceStatusBadge } from './InvoiceStatusBadge'
import { InvoiceTypeBadge } from './InvoiceTypeBadge'
import { formatAmount } from '../hooks/useInvoiceDetail'
import { format } from 'date-fns'
import type { Invoice } from '@/api/types/invoices'

interface InvoiceHeaderProps {
  invoice: Invoice
  canMarkPaid: boolean
  canCancel: boolean
  canUploadFile: boolean
  canSyncToGdrive: boolean
  syncToGdrivePending: boolean
  onMarkPaid: () => void
  onCancel: () => void
  onSyncToGdrive: () => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBack: () => void
}

export function InvoiceHeader({
  invoice,
  canMarkPaid,
  canCancel,
  canUploadFile,
  canSyncToGdrive,
  syncToGdrivePending,
  onMarkPaid,
  onCancel,
  onSyncToGdrive,
  onFileUpload,
  onBack,
}: InvoiceHeaderProps) {
  return (
    <>
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
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
              <Button onClick={onMarkPaid} className="gap-2">
                <CreditCard className="h-4 w-4" />
                Mark as Paid
              </Button>
            )}
            {canCancel && (
              <Button variant="outline" onClick={onCancel} className="gap-2">
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
                    onChange={onFileUpload}
                  />
                </label>
              </Button>
            )}
            {canSyncToGdrive && (
              <Button
                variant="outline"
                onClick={onSyncToGdrive}
                disabled={syncToGdrivePending}
                className="gap-2"
              >
                {syncToGdrivePending ? (
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
    </>
  )
}
