/**
 * DistributionHeader - Compact header card with inline editing
 */

import { Link } from 'react-router-dom'
import {
  Building2,
  Calendar as CalendarIcon,
  DollarSign,
  ExternalLink,
  FileText,
  Loader2,
  MoreHorizontal,
  Percent,
  Plus,
  Trash2,
  Music,
  BarChart3,
  User,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn, formatMoney, formatDate } from '@/lib/utils'
import {
  DEAL_STATUS_CONFIG,
  DEAL_TYPE_CONFIG,
} from '@/types/distribution'
import type { DealStatus, Distribution, ContactPerson } from '@/types/distribution'

interface DistributionHeaderProps {
  distribution: Distribution
  totals: { revenue: number; tracks: number; reports: number }
  signingDateOpen: boolean
  setSigningDateOpen: (open: boolean) => void
  isSavingField: string | null
  showCreateContact: boolean
  setShowCreateContact: (show: boolean) => void
  newContactName: string
  setNewContactName: (name: string) => void
  newContactEmail: string
  setNewContactEmail: (email: string) => void
  newContactPhone: string
  setNewContactPhone: (phone: string) => void
  contactPersons: ContactPerson[]
  createContactPersonPending: boolean
  updateStatusPending: boolean
  onStatusChange: (status: DealStatus) => void
  onSaveSigningDate: (date: Date | undefined) => void
  onChangeContactPerson: (contactPersonId: string) => void
  onCreateContactPerson: () => void
  onDelete: () => void
  navigate: (path: string) => void
}

export function DistributionHeader({
  distribution,
  totals,
  signingDateOpen,
  setSigningDateOpen,
  isSavingField,
  showCreateContact,
  setShowCreateContact,
  newContactName,
  setNewContactName,
  newContactEmail,
  setNewContactEmail,
  newContactPhone,
  setNewContactPhone,
  contactPersons,
  createContactPersonPending,
  updateStatusPending,
  onStatusChange,
  onSaveSigningDate,
  onChangeContactPerson,
  onCreateContactPerson,
  onDelete,
  navigate,
}: DistributionHeaderProps) {
  const typeConfig = DEAL_TYPE_CONFIG[distribution.deal_type]

  return (
    <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-lg">
      <div className="p-5 space-y-4">
        {/* Row 1: Title, Entity, Metadata, Actions */}
        <div className="flex items-center justify-between gap-6">
          {/* Left: Title and Entity */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold truncate">
                  <Link
                    to={`/entities/${distribution.entity.id}`}
                    className="hover:underline"
                  >
                    {distribution.entity.display_name}
                  </Link>
                </h1>
                <Badge variant="outline" className="text-xs shrink-0">
                  {typeConfig.emoji} {typeConfig.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {/* Entity Link with Avatar */}
                <Link
                  to={`/entities/${distribution.entity.id}`}
                  className="flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  {distribution.entity.image_url ? (
                    <img
                      src={distribution.entity.image_url}
                      alt={distribution.entity.display_name}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-4 w-4" />
                  )}
                  <span className="font-medium">{distribution.entity.kind === 'PJ' ? 'Legal Entity' : 'Individual'}</span>
                </Link>
                <span className="text-muted-foreground/50">-</span>
                {/* Signing Date - Editable */}
                <SigningDatePicker
                  signingDate={distribution.signing_date}
                  open={signingDateOpen}
                  setOpen={setSigningDateOpen}
                  isSaving={isSavingField === 'signing_date'}
                  onSave={onSaveSigningDate}
                />
                <span className="text-muted-foreground/50">-</span>
                {/* Contact Person - Editable */}
                <ContactPersonPopover
                  distribution={distribution}
                  contactPersons={contactPersons}
                  isSavingField={isSavingField}
                  showCreateContact={showCreateContact}
                  setShowCreateContact={setShowCreateContact}
                  newContactName={newContactName}
                  setNewContactName={setNewContactName}
                  newContactEmail={newContactEmail}
                  setNewContactEmail={setNewContactEmail}
                  newContactPhone={newContactPhone}
                  setNewContactPhone={setNewContactPhone}
                  createContactPersonPending={createContactPersonPending}
                  onChangeContactPerson={onChangeContactPerson}
                  onCreateContactPerson={onCreateContactPerson}
                />
                <span className="text-muted-foreground/50">-</span>
                {/* Contract Status Badge */}
                {distribution.contract ? (
                  <Badge
                    variant="outline"
                    className="text-xs gap-1 border-emerald-500/50 text-emerald-500 bg-emerald-500/10"
                  >
                    <FileText className="h-3 w-3" />
                    {distribution.contract.contract_number}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-xs gap-1 border-muted-foreground/30 text-muted-foreground/60"
                  >
                    <FileText className="h-3 w-3" />
                    No Contract
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Right: Status Flow & Actions */}
          <div className="flex items-center gap-3">
            {/* Status Workflow Pills */}
            <StatusWorkflow
              currentStatus={distribution.deal_status}
              onStatusChange={onStatusChange}
              isPending={updateStatusPending}
            />

            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/entities/${distribution.entity.id}`)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Entity
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Distribution
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Row 2: Stats Inline */}
        <div className="flex items-center gap-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-6 flex-1">
            <StatItem icon={DollarSign} color="emerald" label="Revenue" value={formatMoney(totals.revenue, 'EUR')} />
            <StatItem icon={Percent} color="blue" label="Share" value={`${parseFloat(distribution.global_revenue_share_percentage).toFixed(0)}%`} />
            <StatItem icon={Music} color="purple" label="Catalog" value={String(totals.tracks)} />
            <StatItem icon={BarChart3} color="orange" label="Reports" value={String(totals.reports)} />
          </div>
        </div>
      </div>
    </Card>
  )
}

// Sub-components

function StatItem({ icon: Icon, color, label, value }: { icon: any; color: string; label: string; value: string }) {
  const bgColorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/20',
    blue: 'bg-blue-500/20',
    purple: 'bg-purple-500/20',
    orange: 'bg-orange-500/20',
  }
  const textColorMap: Record<string, string> = {
    emerald: 'text-emerald-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    orange: 'text-orange-500',
  }

  return (
    <div className="flex items-center gap-2">
      <div className={cn("p-1.5 rounded-md", bgColorMap[color])}>
        <Icon className={cn("h-3.5 w-3.5", textColorMap[color])} />
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  )
}

function SigningDatePicker({
  signingDate,
  open,
  setOpen,
  isSaving,
  onSave,
}: {
  signingDate?: string | null
  open: boolean
  setOpen: (open: boolean) => void
  isSaving: boolean
  onSave: (date: Date | undefined) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "px-1.5 py-0.5 rounded transition-colors hover:bg-muted/50",
              !signingDate && "text-amber-500"
            )}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : signingDate ? (
              formatDate(signingDate)
            ) : (
              'Set Date'
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={signingDate ? new Date(signingDate) : undefined}
            onSelect={onSave}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

function StatusWorkflow({
  currentStatus,
  onStatusChange,
  isPending,
}: {
  currentStatus: DealStatus
  onStatusChange: (status: DealStatus) => void
  isPending: boolean
}) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl">
      {(['in_negotiation', 'active', 'expired'] as DealStatus[]).map((status, idx) => {
        const config = DEAL_STATUS_CONFIG[status]
        const isActive = currentStatus === status
        const isPast = (['in_negotiation', 'active', 'expired'] as DealStatus[]).indexOf(currentStatus) > idx

        return (
          <button
            key={status}
            onClick={() => onStatusChange(status)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              isActive && cn(config.bgColor, config.color),
              isPast && 'opacity-40',
              !isActive && !isPast && 'text-muted-foreground hover:bg-muted/50'
            )}
            disabled={isPending}
          >
            <span className={cn('h-2 w-2 rounded-full', isActive ? config.dotColor : 'bg-muted-foreground/30')} />
            {config.label}
          </button>
        )
      })}
    </div>
  )
}

function ContactPersonPopover({
  distribution,
  contactPersons,
  isSavingField,
  showCreateContact,
  setShowCreateContact,
  newContactName,
  setNewContactName,
  newContactEmail,
  setNewContactEmail,
  newContactPhone,
  setNewContactPhone,
  createContactPersonPending,
  onChangeContactPerson,
  onCreateContactPerson,
}: {
  distribution: Distribution
  contactPersons: ContactPerson[]
  isSavingField: string | null
  showCreateContact: boolean
  setShowCreateContact: (show: boolean) => void
  newContactName: string
  setNewContactName: (name: string) => void
  newContactEmail: string
  setNewContactEmail: (email: string) => void
  newContactPhone: string
  setNewContactPhone: (phone: string) => void
  createContactPersonPending: boolean
  onChangeContactPerson: (contactPersonId: string) => void
  onCreateContactPerson: () => void
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 px-1.5 py-0.5 rounded transition-colors hover:bg-muted/50",
            !distribution.contact_person && "text-amber-500"
          )}
          disabled={isSavingField === 'contact_person'}
        >
          <User className="h-3.5 w-3.5" />
          {isSavingField === 'contact_person' ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : distribution.contact_person ? (
            <span>{distribution.contact_person.name}</span>
          ) : (
            <span>Contact</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Contact Person</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateContact(true)}
              className="h-6 text-xs px-2"
            >
              <Plus className="h-3 w-3 mr-1" />
              New
            </Button>
          </div>
          {showCreateContact ? (
            <div className="space-y-2">
              <Input
                placeholder="Name *"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                className="h-8 text-sm"
                autoFocus
              />
              <Input
                placeholder="Email"
                type="email"
                value={newContactEmail}
                onChange={(e) => setNewContactEmail(e.target.value)}
                className="h-8 text-sm"
              />
              <Input
                placeholder="Phone"
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                className="h-8 text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowCreateContact(false)
                    setNewContactName('')
                    setNewContactEmail('')
                    setNewContactPhone('')
                  }}
                  className="h-7 text-xs flex-1"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={onCreateContactPerson}
                  disabled={!newContactName.trim() || createContactPersonPending}
                  className="h-7 text-xs flex-1"
                >
                  {createContactPersonPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    'Create'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {distribution.contact_person ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{distribution.contact_person.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => onChangeContactPerson('none')}
                      disabled={isSavingField === 'contact_person'}
                      title="Remove contact person"
                    >
                      {isSavingField === 'contact_person' ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  {distribution.contact_person.email && (
                    <p className="text-xs text-muted-foreground">{distribution.contact_person.email}</p>
                  )}
                </div>
              ) : null}
              {contactPersons.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {distribution.contact_person ? 'Change to:' : 'Select:'}
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {contactPersons
                      .filter(cp => cp.id !== distribution.contact_person?.id)
                      .map(cp => (
                        <button
                          key={cp.id}
                          onClick={() => onChangeContactPerson(String(cp.id))}
                          className="w-full text-left p-2 rounded-lg text-sm hover:bg-muted/50 transition-colors"
                          disabled={isSavingField === 'contact_person'}
                        >
                          <p className="font-medium">{cp.name}</p>
                          {cp.email && (
                            <p className="text-xs text-muted-foreground">{cp.email}</p>
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              )}
              {!distribution.contact_person && contactPersons.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No contacts yet. Create one above.
                </p>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
