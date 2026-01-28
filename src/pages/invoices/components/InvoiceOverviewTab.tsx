/**
 * InvoiceOverviewTab - Overview tab with financial details, dates, relationships
 */

import {
  Building2,
  Calendar,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { formatAmount } from '../hooks/useInvoiceDetail'
import { format } from 'date-fns'
import type { Invoice } from '@/api/types/invoices'

interface InvoiceOverviewTabProps {
  invoice: Invoice
}

export function InvoiceOverviewTab({ invoice }: InvoiceOverviewTabProps) {
  return (
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
  )
}

export function InvoiceNotesSection({ notes }: { notes?: string }) {
  if (!notes) return null

  return (
    <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground whitespace-pre-wrap">{notes}</p>
      </CardContent>
    </Card>
  )
}
