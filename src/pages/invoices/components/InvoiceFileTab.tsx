/**
 * InvoiceFileTab - File preview and AI extraction tab
 */

import {
  CheckCircle,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PDFViewer } from '@/components/ui/pdf-viewer'
import { ExtractionStatusBadge } from './ExtractionStatusBadge'
import { formatAmount } from '../hooks/useInvoiceDetail'
import { format } from 'date-fns'
import type { Invoice } from '@/api/types/invoices'

interface InvoiceFileTabProps {
  invoice: Invoice
  acceptExtractionPending: boolean
  retryExtractionPending: boolean
  onAcceptExtraction: () => void
  onRetryExtraction: () => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function InvoiceFileTab({
  invoice,
  acceptExtractionPending,
  retryExtractionPending,
  onAcceptExtraction,
  onRetryExtraction,
  onFileUpload,
}: InvoiceFileTabProps) {
  return (
    <div className="space-y-6">
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
                {invoice.file?.toLowerCase().endsWith('.pdf') ? (
                  <PDFViewer url={invoice.file} />
                ) : (
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
                      onChange={onFileUpload}
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
                  onClick={onAcceptExtraction}
                  disabled={acceptExtractionPending}
                  className="gap-2"
                >
                  {acceptExtractionPending ? (
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
                  onClick={onRetryExtraction}
                  disabled={retryExtractionPending}
                  className="gap-2"
                >
                  {retryExtractionPending ? (
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

      {/* Extracted Invoice Data */}
      {invoice.extraction_successful && (
        <ExtractedDataCard invoice={invoice} />
      )}
    </div>
  )
}

function ExtractedDataCard({ invoice }: { invoice: Invoice }) {
  return (
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
              <DetailRow label="Invoice Number" value={invoice.extracted_invoice_number} mono />
              <DetailRow
                label="Invoice Date"
                value={invoice.extracted_invoice_date ? format(new Date(invoice.extracted_invoice_date), 'PPP') : null}
              />
              <DetailRow
                label="Due Date"
                value={invoice.extracted_due_date ? format(new Date(invoice.extracted_due_date), 'PPP') : null}
              />
              <DetailRow label="Payment Terms" value={invoice.extracted_payment_terms} />
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
              <DetailRow label="VAT ID" value={invoice.extracted_vendor_vat} mono />
              <DetailRow label="Country" value={invoice.extracted_vendor_country} />
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Financial Breakdown
            </h4>
            <div className="space-y-3">
              <DetailRow
                label="Subtotal"
                value={invoice.extracted_subtotal ? formatAmount(invoice.extracted_subtotal, invoice.extracted_currency || invoice.currency) : null}
                mono
              />
              <DetailRow
                label="Tax Rate"
                value={invoice.extracted_tax_rate ? `${invoice.extracted_tax_rate}%` : null}
              />
              <DetailRow
                label="Tax Amount"
                value={invoice.extracted_tax_amount ? formatAmount(invoice.extracted_tax_amount, invoice.extracted_currency || invoice.currency) : null}
                mono
              />
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
  )
}

function DetailRow({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className={mono ? 'font-mono text-sm' : 'text-sm'}>{value || '-'}</span>
    </div>
  )
}
