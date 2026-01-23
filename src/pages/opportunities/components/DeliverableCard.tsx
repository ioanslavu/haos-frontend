/**
 * DeliverableCard - Expandable card for opportunity deliverables
 *
 * Matches Campaign's SubCampaignCard and Distribution's SongCard patterns:
 * - Collapsible card with summary header
 * - Click-to-edit inline fields
 * - Icon with brand colors
 * - Status badge
 */

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  Loader2,
  Calendar as CalendarIcon,
} from 'lucide-react'
import {
  SiInstagram,
  SiTiktok,
  SiYoutube,
} from 'react-icons/si'
import {
  HiTv,
  HiMegaphone,
  HiMicrophone,
  HiPhoto,
  HiGlobeAlt,
  HiSignal,
  HiNewspaper,
  HiComputerDesktop,
  HiBuildingStorefront,
  HiCube,
} from 'react-icons/hi2'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useUpdateOpportunityDeliverable } from '@/api/hooks/useOpportunities'
import { opportunityDeliverablesApi } from '@/api/services/opportunities.service'
import { useQueryClient } from '@tanstack/react-query'
import { opportunityKeys } from '@/api/hooks/useOpportunities'
import { cn, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { DeliverableType, DeliverableStatus } from '@/types/opportunities'
import { DELIVERABLE_TYPE_CONFIG } from '@/types/opportunities'

// Deliverable type config with icons and colors
const DELIVERABLE_ICON_CONFIG: Record<DeliverableType, {
  icon: React.ComponentType<{ className?: string }>
  color: string
  textColor: string
}> = {
  ig_post: { icon: SiInstagram, color: 'bg-[#E4405F]/10 border-[#E4405F]/30', textColor: 'text-[#E4405F]' },
  ig_story: { icon: SiInstagram, color: 'bg-[#E4405F]/10 border-[#E4405F]/30', textColor: 'text-[#E4405F]' },
  ig_reel: { icon: SiInstagram, color: 'bg-[#E4405F]/10 border-[#E4405F]/30', textColor: 'text-[#E4405F]' },
  tiktok_video: { icon: SiTiktok, color: 'bg-foreground/10 border-foreground/30', textColor: 'text-foreground' },
  youtube_video: { icon: SiYoutube, color: 'bg-[#FF0000]/10 border-[#FF0000]/30', textColor: 'text-[#FF0000]' },
  youtube_short: { icon: SiYoutube, color: 'bg-[#FF0000]/10 border-[#FF0000]/30', textColor: 'text-[#FF0000]' },
  tvc: { icon: HiTv, color: 'bg-blue-500/10 border-blue-500/30', textColor: 'text-blue-500' },
  radio_spot: { icon: HiMegaphone, color: 'bg-amber-500/10 border-amber-500/30', textColor: 'text-amber-500' },
  event: { icon: HiMicrophone, color: 'bg-purple-500/10 border-purple-500/30', textColor: 'text-purple-500' },
  ooh: { icon: HiBuildingStorefront, color: 'bg-emerald-500/10 border-emerald-500/30', textColor: 'text-emerald-500' },
  billboard: { icon: HiPhoto, color: 'bg-cyan-500/10 border-cyan-500/30', textColor: 'text-cyan-500' },
  packaging: { icon: HiCube, color: 'bg-orange-500/10 border-orange-500/30', textColor: 'text-orange-500' },
  print_ad: { icon: HiNewspaper, color: 'bg-stone-500/10 border-stone-500/30', textColor: 'text-stone-500' },
  digital_banner: { icon: HiComputerDesktop, color: 'bg-indigo-500/10 border-indigo-500/30', textColor: 'text-indigo-500' },
  podcast: { icon: HiMicrophone, color: 'bg-violet-500/10 border-violet-500/30', textColor: 'text-violet-500' },
  livestream: { icon: HiSignal, color: 'bg-red-500/10 border-red-500/30', textColor: 'text-red-500' },
  other: { icon: HiGlobeAlt, color: 'bg-muted border-muted-foreground/30', textColor: 'text-muted-foreground' },
}

// Status options
const STATUS_OPTIONS: { value: DeliverableStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'approved', label: 'Approved' },
]

interface Deliverable {
  id: number
  deliverable_type: DeliverableType
  quantity: number
  description?: string | null
  status: DeliverableStatus
  due_date?: string | null
}

interface DeliverableCardProps {
  deliverable: Deliverable
  opportunityId: number
  isExpanded: boolean
  onToggleExpand: () => void
}

export function DeliverableCard({
  deliverable,
  opportunityId,
  isExpanded,
  onToggleExpand,
}: DeliverableCardProps) {
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [dueDateOpen, setDueDateOpen] = useState(false)

  // Inline editing state
  type EditableField = 'quantity' | 'description' | null
  const [editingField, setEditingField] = useState<EditableField>(null)

  // Field values
  const [quantityInput, setQuantityInput] = useState(String(deliverable.quantity))
  const [descriptionInput, setDescriptionInput] = useState(deliverable.description || '')

  // Sync input values when deliverable data changes
  useEffect(() => {
    if (editingField === null) {
      setQuantityInput(String(deliverable.quantity))
      setDescriptionInput(deliverable.description || '')
    }
  }, [deliverable, editingField])

  const updateDeliverable = useUpdateOpportunityDeliverable()

  const iconConfig = DELIVERABLE_ICON_CONFIG[deliverable.deliverable_type]
  const typeConfig = DELIVERABLE_TYPE_CONFIG[deliverable.deliverable_type]
  const Icon = iconConfig?.icon || HiGlobeAlt

  // Handle field save
  const handleSaveField = async (field: NonNullable<EditableField>) => {
    const inputMap: Record<string, string> = {
      quantity: quantityInput,
      description: descriptionInput,
    }
    const originalMap: Record<string, string> = {
      quantity: String(deliverable.quantity),
      description: deliverable.description || '',
    }
    const setterMap: Record<string, (v: string) => void> = {
      quantity: setQuantityInput,
      description: setDescriptionInput,
    }

    if (inputMap[field] === originalMap[field]) {
      setEditingField(null)
      return
    }

    try {
      const data: Record<string, unknown> = {}
      if (field === 'quantity') {
        data.quantity = parseInt(inputMap[field]) || 1
      } else {
        data[field] = inputMap[field] || undefined
      }

      await updateDeliverable.mutateAsync({
        id: deliverable.id,
        data,
      })
      setEditingField(null)
    } catch {
      setterMap[field](originalMap[field])
      setEditingField(null)
    }
  }

  // Handle status change
  const handleStatusChange = async (status: DeliverableStatus) => {
    try {
      await updateDeliverable.mutateAsync({
        id: deliverable.id,
        data: { status },
      })
    } catch {
      // Error handled by mutation
    }
  }

  // Handle due date change
  const handleDueDateChange = async (date: Date | undefined) => {
    try {
      await updateDeliverable.mutateAsync({
        id: deliverable.id,
        data: { due_date: date ? format(date, 'yyyy-MM-dd') : null },
      })
      setDueDateOpen(false)
    } catch {
      // Error handled by mutation
    }
  }

  // Handle delete
  const handleDelete = async () => {
    try {
      await opportunityDeliverablesApi.delete(deliverable.id)
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(opportunityId) })
      toast.success('Deliverable removed')
      setShowDeleteConfirm(false)
    } catch {
      toast.error('Failed to remove deliverable')
    }
  }

  return (
    <>
      <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm overflow-hidden">
        <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
          {/* Header - entire row is clickable */}
          <CollapsibleTrigger asChild>
            <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 shrink-0 flex items-center justify-center">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {/* Icon */}
                <div className={cn('p-2 rounded-lg border', iconConfig?.color, iconConfig?.textColor)}>
                  <Icon className="h-6 w-6" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{typeConfig?.label || deliverable.deliverable_type}</h4>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>×{deliverable.quantity}</span>
                    {deliverable.due_date && (
                      <>
                        <span className="text-muted-foreground/40">•</span>
                        <span>Due {formatDate(deliverable.due_date)}</span>
                      </>
                    )}
                    {deliverable.description && (
                      <>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="truncate max-w-[200px]">{deliverable.description}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <Badge
                  variant={
                    deliverable.status === 'completed' || deliverable.status === 'approved'
                      ? 'default'
                      : deliverable.status === 'in_progress'
                      ? 'secondary'
                      : 'outline'
                  }
                  className="capitalize shrink-0"
                >
                  {deliverable.status.replace('_', ' ')}
                </Badge>

                {/* Delete Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeleteConfirm(true)
                  }}
                  title="Delete deliverable"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CollapsibleTrigger>

          {/* Expanded Content */}
          <CollapsibleContent>
            <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-4">
              {/* Basic Info - Click to edit */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Quantity */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Quantity</p>
                  {editingField === 'quantity' ? (
                    <Input
                      type="number"
                      min="1"
                      value={quantityInput}
                      onChange={(e) => setQuantityInput(e.target.value)}
                      onBlur={() => handleSaveField('quantity')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveField('quantity')
                        if (e.key === 'Escape') {
                          setQuantityInput(String(deliverable.quantity))
                          setEditingField(null)
                        }
                      }}
                      className="h-8 text-sm w-20"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => setEditingField('quantity')}
                      className="font-medium hover:bg-muted/50 px-2 py-1 -mx-2 rounded transition-colors text-left"
                    >
                      {deliverable.quantity}
                    </button>
                  )}
                </div>

                {/* Due Date */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                  <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-1 -mx-2 rounded text-sm transition-colors hover:bg-muted/50 text-left",
                          !deliverable.due_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="h-3 w-3" />
                        {deliverable.due_date ? format(new Date(deliverable.due_date), 'MMM d, yyyy') : 'Set date'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={deliverable.due_date ? new Date(deliverable.due_date) : undefined}
                        onSelect={handleDueDateChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Description */}
                <div className="col-span-2 md:col-span-1">
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  {editingField === 'description' ? (
                    <Input
                      value={descriptionInput}
                      onChange={(e) => setDescriptionInput(e.target.value)}
                      onBlur={() => handleSaveField('description')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveField('description')
                        if (e.key === 'Escape') {
                          setDescriptionInput(deliverable.description || '')
                          setEditingField(null)
                        }
                      }}
                      className="h-8 text-sm"
                      placeholder="Add description..."
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => setEditingField('description')}
                      className="text-sm hover:bg-muted/50 px-2 py-1 -mx-2 rounded transition-colors text-left w-full truncate"
                    >
                      {deliverable.description || <span className="text-muted-foreground">Add description...</span>}
                    </button>
                  )}
                </div>
              </div>

              {/* Status Selection */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Status</p>
                <div className="flex gap-1 flex-wrap">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleStatusChange(option.value)}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium transition-all',
                        deliverable.status === option.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deliverable</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this {typeConfig?.label || 'deliverable'} from the opportunity?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
