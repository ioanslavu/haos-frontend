/**
 * SubCampaignCardExpanded - Expanded content for subcampaign card
 */

import {
  Calendar as CalendarIcon,
  Loader2,
  Music2,
  User,
  Receipt,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CollapsibleContent } from '@/components/ui/collapsible'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { SubCampaignInvoiceList } from '../SubCampaignInvoiceList'
import { formatDate, cn } from '@/lib/utils'
import { RevenueShareFields, ServiceFeeFields } from './SubCampaignFinancials'
import { KPISection } from './KPISection'
import type { SubCampaign, EditableField } from './types'

interface SubCampaignCardExpandedProps {
  subcampaign: SubCampaign
  campaignId: number
  canViewSensitiveData: boolean
  // Date state
  startDateOpen: boolean
  setStartDateOpen: (open: boolean) => void
  endDateOpen: boolean
  setEndDateOpen: (open: boolean) => void
  isSavingDates: boolean
  handleSaveStartDate: (date: Date | undefined) => void
  handleSaveEndDate: (date: Date | undefined) => void
  // Payment/currency handlers
  handlePaymentMethodChange: (value: string) => void
  handleCurrencyChange: (value: string) => void
  // Financial fields
  editingField: EditableField
  setEditingField: (field: EditableField) => void
  isRevenueShare: boolean
  inputs: {
    clientValue: string
    setClientValue: (v: string) => void
    budget: string
    setBudget: (v: string) => void
    spent: string
    setSpent: (v: string) => void
    internalCost: string
    setInternalCost: (v: string) => void
    revenueGenerated: string
    setRevenueGenerated: (v: string) => void
    partnerShare: string
    setPartnerShare: (v: string) => void
  }
  handleSaveField: (field: NonNullable<EditableField>) => void
  // Invoice
  onAddInvoice: () => void
}

export function SubCampaignCardExpanded({
  subcampaign,
  campaignId,
  canViewSensitiveData,
  startDateOpen,
  setStartDateOpen,
  endDateOpen,
  setEndDateOpen,
  isSavingDates,
  handleSaveStartDate,
  handleSaveEndDate,
  handlePaymentMethodChange,
  handleCurrencyChange,
  editingField,
  setEditingField,
  isRevenueShare,
  inputs,
  handleSaveField,
  onAddInvoice,
}: SubCampaignCardExpandedProps) {
  return (
    <CollapsibleContent>
      <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-4">
        {/* Songs */}
        {subcampaign.songs && subcampaign.songs.length > 0 && (
          <div>
            <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Music2 className="h-4 w-4" />
              Songs ({subcampaign.songs.length})
            </h5>
            <div className="flex flex-wrap gap-2">
              {subcampaign.songs.map((song) => (
                <Badge key={song.id} variant="secondary" className="text-xs">
                  {song.title}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Artists */}
        {subcampaign.artists && subcampaign.artists.length > 0 && (
          <div>
            <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Artists ({subcampaign.artists.length})
            </h5>
            <div className="flex flex-wrap gap-2">
              {subcampaign.artists.map((artist) => (
                <Badge key={artist.id} variant="outline" className="text-xs">
                  {artist.display_name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              Start Date
              {!subcampaign.start_date && (
                <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" title="Required" />
              )}
            </p>
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm transition-colors",
                    "hover:bg-muted/50",
                    !subcampaign.start_date ? "text-amber-500" : "font-medium"
                  )}
                  disabled={isSavingDates}
                >
                  {isSavingDates ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CalendarIcon className="h-3 w-3" />
                  )}
                  {subcampaign.start_date ? formatDate(subcampaign.start_date) : 'Set date'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={subcampaign.start_date ? new Date(subcampaign.start_date) : undefined}
                  onSelect={handleSaveStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              End Date
              {!subcampaign.end_date && (
                <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" title="Required" />
              )}
            </p>
            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm transition-colors",
                    "hover:bg-muted/50",
                    !subcampaign.end_date ? "text-amber-500" : "font-medium"
                  )}
                  disabled={isSavingDates}
                >
                  {isSavingDates ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CalendarIcon className="h-3 w-3" />
                  )}
                  {subcampaign.end_date ? formatDate(subcampaign.end_date) : 'Set date'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={subcampaign.end_date ? new Date(subcampaign.end_date) : undefined}
                  onSelect={handleSaveEndDate}
                  disabled={(date) =>
                    subcampaign.start_date ? date < new Date(subcampaign.start_date) : false
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Pricing Model & Currency Selector */}
        <div className="flex items-center gap-6 pt-2">
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">Pricing Model</p>
            <Select
              value={subcampaign.payment_method === 'revenue_share' ? 'revenue_share' : 'service_fee'}
              onValueChange={handlePaymentMethodChange}
            >
              <SelectTrigger className="w-[140px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="service_fee">Service Fee</SelectItem>
                <SelectItem value="revenue_share">Revenue Share</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">Currency</p>
            <Select
              value={subcampaign.currency}
              onValueChange={handleCurrencyChange}
            >
              <SelectTrigger className="w-[90px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="RON">RON</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Financial Details - Different fields based on pricing model */}
        {isRevenueShare ? (
          <RevenueShareFields
            subcampaign={subcampaign}
            campaignId={campaignId}
            editingField={editingField}
            setEditingField={setEditingField}
            canViewSensitiveData={canViewSensitiveData}
            inputs={{
              revenueGenerated: inputs.revenueGenerated,
              setRevenueGenerated: inputs.setRevenueGenerated,
              partnerShare: inputs.partnerShare,
              setPartnerShare: inputs.setPartnerShare,
              spent: inputs.spent,
              setSpent: inputs.setSpent,
              internalCost: inputs.internalCost,
              setInternalCost: inputs.setInternalCost,
            }}
            onSaveField={handleSaveField}
          />
        ) : (
          <ServiceFeeFields
            subcampaign={subcampaign}
            campaignId={campaignId}
            editingField={editingField}
            setEditingField={setEditingField}
            canViewSensitiveData={canViewSensitiveData}
            inputs={{
              clientValue: inputs.clientValue,
              setClientValue: inputs.setClientValue,
              budget: inputs.budget,
              setBudget: inputs.setBudget,
              spent: inputs.spent,
              setSpent: inputs.setSpent,
              internalCost: inputs.internalCost,
              setInternalCost: inputs.setInternalCost,
            }}
            onSaveField={handleSaveField}
          />
        )}

        {/* KPIs Section */}
        <KPISection
          subcampaign={subcampaign}
          campaignId={campaignId}
        />

        {/* Notes */}
        {subcampaign.notes && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-1">Notes</p>
            <p className="text-sm">{subcampaign.notes}</p>
          </div>
        )}

        {/* Invoices Section */}
        <div className="pt-4 mt-4 border-t border-white/5">
          <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Platform Invoices
          </h5>
          <SubCampaignInvoiceList
            campaignId={campaignId}
            subcampaign={subcampaign}
            onAddInvoice={onAddInvoice}
          />
        </div>
      </div>
    </CollapsibleContent>
  )
}
