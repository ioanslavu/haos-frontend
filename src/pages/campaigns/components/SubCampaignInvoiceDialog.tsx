/**
 * SubCampaignInvoiceDialog - Upload and manage invoices for platform spend tracking
 *
 * Features:
 * - File upload with drag & drop
 * - AI extraction with real-time status polling
 * - Manual amount entry fallback
 * - Accept/reject extraction flow
 */

import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  Upload,
  FileText,
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import type { SubCampaign } from '@/types/campaign'
import {
  useUploadSubCampaignInvoice,
  useInvoiceExtractionStatus,
  useAcceptSubCampaignInvoiceExtraction,
  useSetSubCampaignInvoiceAmount,
  useRetrySubCampaignInvoiceExtraction,
  subCampaignInvoiceKeys,
} from '@/api/hooks/useCampaigns'
import { useQueryClient } from '@tanstack/react-query'
import { PLATFORM_CONFIG } from '@/types/campaign'
import { PLATFORM_ICONS, PLATFORM_COLORS } from '@/lib/platform-icons'

interface SubCampaignInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: number
  campaignName: string
  subcampaign: SubCampaign
  onSuccess?: () => void
}

type DialogState = 'upload' | 'uploading' | 'extracting' | 'extraction_success' | 'extraction_failed' | 'manual' | 'confirming'

const CURRENCY_OPTIONS = [
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'RON', label: 'RON - Romanian Leu' },
]

export function SubCampaignInvoiceDialog({
  open,
  onOpenChange,
  campaignId,
  campaignName,
  subcampaign,
  onSuccess,
}: SubCampaignInvoiceDialogProps) {
  const queryClient = useQueryClient()
  const platformConfig = PLATFORM_CONFIG[subcampaign.platform]

  // State
  const [dialogState, setDialogState] = useState<DialogState>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [manualAmount, setManualAmount] = useState('')
  const [manualCurrency, setManualCurrency] = useState(subcampaign.currency || 'EUR')

  // Auto-generated invoice name: {platform} - {campaign_name}
  const invoiceName = `${platformConfig?.label || subcampaign.platform} - ${campaignName}`
  // Use subcampaign currency by default
  const currency = subcampaign.currency || 'EUR'
  const [createdInvoiceLinkId, setCreatedInvoiceLinkId] = useState<number | null>(null)
  const [createdInvoiceId, setCreatedInvoiceId] = useState<number | null>(null)
  const [extractionResult, setExtractionResult] = useState<{
    amount: string | null
    currency: string | null
    confidence: number | null
    notes: string | null
  } | null>(null)

  // Mutations
  const uploadMutation = useUploadSubCampaignInvoice()
  const acceptExtractionMutation = useAcceptSubCampaignInvoiceExtraction()
  const setAmountMutation = useSetSubCampaignInvoiceAmount()
  const retryExtractionMutation = useRetrySubCampaignInvoiceExtraction()

  // Poll extraction status when in extracting state
  const { data: extractionStatus } = useInvoiceExtractionStatus(createdInvoiceId || 0, {
    enabled: dialogState === 'extracting' && !!createdInvoiceId,
    refetchInterval: 2000,
  })

  // Handle extraction status changes
  useEffect(() => {
    if (!extractionStatus || dialogState !== 'extracting') return

    if (extractionStatus.extraction_status === 'success') {
      setExtractionResult({
        amount: extractionStatus.extracted_amount,
        currency: extractionStatus.extracted_currency,
        confidence: extractionStatus.extraction_confidence,
        notes: extractionStatus.extraction_notes,
      })
      setDialogState('extraction_success')
    } else if (extractionStatus.extraction_status === 'failed') {
      setExtractionResult({
        amount: null,
        currency: null,
        confidence: null,
        notes: extractionStatus.extraction_notes,
      })
      setDialogState('extraction_failed')
    }
  }, [extractionStatus, dialogState])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setDialogState('upload')
      setSelectedFile(null)
      setManualAmount('')
      setManualCurrency(subcampaign.currency || 'EUR')
      setCreatedInvoiceLinkId(null)
      setCreatedInvoiceId(null)
      setExtractionResult(null)
    }
  }, [open, subcampaign.currency])

  // Dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  })

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile || !invoiceName.trim()) return

    setDialogState('uploading')

    try {
      const result = await uploadMutation.mutateAsync({
        campaignId,
        subcampaignId: subcampaign.id,
        data: {
          file: selectedFile,
          name: invoiceName.trim(),
          invoice_type: 'expense',
          currency,
        },
      })

      setCreatedInvoiceLinkId(result.id)
      setCreatedInvoiceId(result.invoice)

      if (result.extraction_task_id) {
        setDialogState('extracting')
      } else {
        // No extraction, go to manual
        setDialogState('manual')
      }
    } catch (error) {
      setDialogState('upload')
    }
  }

  // Handle accept extraction
  const handleAcceptExtraction = async () => {
    if (!createdInvoiceLinkId) return

    try {
      await acceptExtractionMutation.mutateAsync({
        campaignId,
        subcampaignId: subcampaign.id,
        invoiceLinkId: createdInvoiceLinkId,
      })

      queryClient.invalidateQueries({
        queryKey: subCampaignInvoiceKeys.all(campaignId, subcampaign.id),
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      // Error handled by mutation
    }
  }

  // Handle manual amount submission
  const handleSetManualAmount = async () => {
    if (!createdInvoiceLinkId || !manualAmount) return

    try {
      await setAmountMutation.mutateAsync({
        campaignId,
        subcampaignId: subcampaign.id,
        invoiceLinkId: createdInvoiceLinkId,
        data: {
          amount: manualAmount,
          currency: manualCurrency,
        },
      })

      queryClient.invalidateQueries({
        queryKey: subCampaignInvoiceKeys.all(campaignId, subcampaign.id),
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      // Error handled by mutation
    }
  }

  // Handle retry extraction
  const handleRetryExtraction = async () => {
    if (!createdInvoiceLinkId) return

    try {
      await retryExtractionMutation.mutateAsync({
        campaignId,
        subcampaignId: subcampaign.id,
        invoiceLinkId: createdInvoiceLinkId,
      })
      setDialogState('extracting')
    } catch (error) {
      // Error handled by mutation
    }
  }

  // Render confidence badge
  const renderConfidenceBadge = (confidence: number | null) => {
    if (confidence === null) return null

    const percentage = Math.round(confidence * 100)
    let variant: 'default' | 'secondary' | 'destructive' = 'default'

    if (percentage >= 80) variant = 'default'
    else if (percentage >= 50) variant = 'secondary'
    else variant = 'destructive'

    return (
      <Badge variant={variant} className="text-xs">
        {percentage}% confidence
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {(() => {
              const Icon = PLATFORM_ICONS[subcampaign.platform]
              const brandColor = PLATFORM_COLORS[subcampaign.platform]
              return (
                <div className={cn(
                  'p-1.5 rounded-lg',
                  brandColor ? brandColor.split(' ')[1] : 'bg-muted'
                )}>
                  <Icon className={cn(
                    'h-4 w-4',
                    brandColor ? brandColor.split(' ')[0] : 'text-foreground'
                  )} />
                </div>
              )
            })()}
            Add Invoice - {platformConfig?.label || subcampaign.platform}
          </DialogTitle>
          <DialogDescription>
            Upload an invoice for platform ad spend. AI will attempt to extract the amount automatically.
          </DialogDescription>
        </DialogHeader>

        {/* Upload State */}
        {dialogState === 'upload' && (
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive
                ? 'border-primary bg-primary/5'
                : selectedFile
                ? 'border-green-500 bg-green-500/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            )}
          >
            <input {...getInputProps()} />
            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="h-10 w-10 text-green-500" />
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedFile(null)
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-10 w-10 text-muted-foreground" />
                <p className="font-medium">
                  {isDragActive ? 'Drop the file here' : 'Drop invoice file or click to browse'}
                </p>
                <p className="text-sm text-muted-foreground">
                  PDF, PNG, JPG up to 10MB
                </p>
              </div>
            )}
          </div>
        )}

        {/* Uploading State */}
        {dialogState === 'uploading' && (
          <div className="py-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="mt-4 font-medium">Uploading invoice...</p>
          </div>
        )}

        {/* Extracting State */}
        {dialogState === 'extracting' && (
          <div className="py-8 text-center">
            <div className="relative mx-auto w-16 h-16">
              <Sparkles className="h-12 w-12 mx-auto text-primary animate-pulse" />
            </div>
            <p className="mt-4 font-medium">AI is extracting invoice details...</p>
            <p className="text-sm text-muted-foreground mt-1">This usually takes 10-30 seconds</p>
            <Progress className="mt-4 w-2/3 mx-auto" />
          </div>
        )}

        {/* Extraction Success State */}
        {dialogState === 'extraction_success' && extractionResult && (
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-green-700 dark:text-green-400">
                    Extraction Successful
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Amount</span>
                      <span className="text-2xl font-bold">
                        {extractionResult.currency || currency} {extractionResult.amount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Confidence</span>
                      {renderConfidenceBadge(extractionResult.confidence)}
                    </div>
                  </div>
                  {extractionResult.notes && (
                    <p className="mt-3 text-sm text-muted-foreground">{extractionResult.notes}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span>Review the extracted amount before accepting</span>
            </div>
          </div>
        )}

        {/* Extraction Failed State */}
        {dialogState === 'extraction_failed' && (
          <div className="space-y-4">
            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <div className="flex items-start gap-3">
                <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-red-700 dark:text-red-400">
                    Extraction Failed
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {extractionResult?.notes || 'AI could not extract the invoice amount. Please enter it manually.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Manual Entry Form */}
            <div className="space-y-4 pt-4 border-t">
              <p className="font-medium">Enter Amount Manually</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="manual-amount">Amount</Label>
                  <Input
                    id="manual-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-currency">Currency</Label>
                  <Select value={manualCurrency} onValueChange={setManualCurrency}>
                    <SelectTrigger id="manual-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manual Entry State (no file extraction) */}
        {dialogState === 'manual' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Invoice uploaded. Please enter the amount manually.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="manual-amount">Amount</Label>
                <Input
                  id="manual-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-currency">Currency</Label>
                <Select value={manualCurrency} onValueChange={setManualCurrency}>
                  <SelectTrigger id="manual-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {/* Upload State Buttons */}
          {dialogState === 'upload' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploadMutation.isPending}
              >
                {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload & Extract
              </Button>
            </>
          )}

          {/* Extracting State - just show cancel */}
          {(dialogState === 'uploading' || dialogState === 'extracting') && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}

          {/* Extraction Success State Buttons */}
          {dialogState === 'extraction_success' && (
            <>
              <Button
                variant="outline"
                onClick={() => setDialogState('extraction_failed')}
              >
                Enter Manually
              </Button>
              <Button
                onClick={handleAcceptExtraction}
                disabled={acceptExtractionMutation.isPending}
              >
                {acceptExtractionMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <CheckCircle className="mr-2 h-4 w-4" />
                Accept Amount
              </Button>
            </>
          )}

          {/* Extraction Failed / Manual State Buttons */}
          {(dialogState === 'extraction_failed' || dialogState === 'manual') && (
            <>
              {dialogState === 'extraction_failed' && (
                <Button
                  variant="outline"
                  onClick={handleRetryExtraction}
                  disabled={retryExtractionMutation.isPending}
                >
                  {retryExtractionMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Retry Extraction
                </Button>
              )}
              <Button
                onClick={handleSetManualAmount}
                disabled={!manualAmount || setAmountMutation.isPending}
              >
                {setAmountMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Invoice
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
