/**
 * SubCampaignFinancials - Financial fields editing for subcampaigns
 */

import { Input } from '@/components/ui/input'
import { formatMoney, cn } from '@/lib/utils'
import type { SubCampaignFinancialsProps, EditableField } from './types'

interface FinancialFieldProps {
  label: string
  value: string
  inputValue: string
  setInputValue: (v: string) => void
  field: NonNullable<EditableField>
  editingField: EditableField
  setEditingField: (field: EditableField) => void
  onSave: (field: NonNullable<EditableField>) => void
  currency: string
  isPercentage?: boolean
  min?: string
  max?: string
  step?: string
}

function EditableFinancialField({
  label,
  value,
  inputValue,
  setInputValue,
  field,
  editingField,
  setEditingField,
  onSave,
  currency,
  isPercentage = false,
  min,
  max,
  step = '0.01',
}: FinancialFieldProps) {
  const isEditing = editingField === field

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {isEditing ? (
        <Input
          type="number"
          step={step}
          min={min}
          max={max}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={() => onSave(field)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave(field)
            if (e.key === 'Escape') {
              setInputValue(value)
              setEditingField(null)
            }
          }}
          className="h-8 text-sm"
          autoFocus
        />
      ) : (
        <button
          onClick={() => setEditingField(field)}
          className="font-medium hover:bg-muted/50 px-2 py-1 -mx-2 rounded transition-colors text-left"
        >
          {isPercentage
            ? `${parseFloat(value || '0')}%`
            : formatMoney(parseFloat(value || '0'), currency)
          }
        </button>
      )}
    </div>
  )
}

interface RevenueShareFieldsProps extends SubCampaignFinancialsProps {
  inputs: {
    revenueGenerated: string
    setRevenueGenerated: (v: string) => void
    partnerShare: string
    setPartnerShare: (v: string) => void
    spent: string
    setSpent: (v: string) => void
    internalCost: string
    setInternalCost: (v: string) => void
  }
  onSaveField: (field: NonNullable<EditableField>) => void
}

export function RevenueShareFields({
  subcampaign,
  editingField,
  setEditingField,
  canViewSensitiveData,
  inputs,
  onSaveField,
}: RevenueShareFieldsProps) {
  const spent = parseFloat(subcampaign.spent)

  return (
    <>
      {/* Revenue Share Fields */}
      <div className={cn("grid gap-4 pt-2", canViewSensitiveData ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3")}>
        {/* Total Revenue */}
        <EditableFinancialField
          label="Total Revenue"
          value={subcampaign.revenue_generated || '0'}
          inputValue={inputs.revenueGenerated}
          setInputValue={inputs.setRevenueGenerated}
          field="revenue_generated"
          editingField={editingField}
          setEditingField={setEditingField}
          onSave={onSaveField}
          currency={subcampaign.currency}
        />

        {/* Partner Share % - Admin/Manager only */}
        {canViewSensitiveData && (
          <EditableFinancialField
            label="Partner Share %"
            value={subcampaign.revenue_share_percentage || '0'}
            inputValue={inputs.partnerShare}
            setInputValue={inputs.setPartnerShare}
            field="revenue_share_percentage"
            editingField={editingField}
            setEditingField={setEditingField}
            onSave={onSaveField}
            currency={subcampaign.currency}
            isPercentage
            step="0.1"
            min="0"
            max="100"
          />
        )}

        {/* Our Spend */}
        <EditableFinancialField
          label="Our Spend"
          value={subcampaign.spent || '0'}
          inputValue={inputs.spent}
          setInputValue={inputs.setSpent}
          field="spent"
          editingField={editingField}
          setEditingField={setEditingField}
          onSave={onSaveField}
          currency={subcampaign.currency}
        />

        {/* Est. Cost */}
        <EditableFinancialField
          label="Est. Cost"
          value={subcampaign.internal_cost || '0'}
          inputValue={inputs.internalCost}
          setInputValue={inputs.setInternalCost}
          field="internal_cost"
          editingField={editingField}
          setEditingField={setEditingField}
          onSave={onSaveField}
          currency={subcampaign.currency}
        />
      </div>

      {/* Revenue Share Calculated Fields */}
      <div className={cn("grid gap-4 pt-2 border-t border-white/5", canViewSensitiveData ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2")}>
        {/* Our Share - Admin/Manager only */}
        {canViewSensitiveData && (
          <div>
            <p className="text-xs text-muted-foreground">Our Share</p>
            <p className="font-medium text-green-500">
              {formatMoney(
                parseFloat(subcampaign.revenue_generated || '0') * (1 - parseFloat(subcampaign.revenue_share_percentage || '0') / 100),
                subcampaign.currency
              )}
            </p>
          </div>
        )}
        {/* Partner Gets - Admin/Manager only */}
        {canViewSensitiveData && (
          <div>
            <p className="text-xs text-muted-foreground">Partner Gets</p>
            <p className="font-medium">
              {formatMoney(
                parseFloat(subcampaign.revenue_generated || '0') * (parseFloat(subcampaign.revenue_share_percentage || '0') / 100),
                subcampaign.currency
              )}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground">Net Profit</p>
          <p className={cn(
            "font-medium",
            (parseFloat(subcampaign.revenue_generated || '0') * (1 - parseFloat(subcampaign.revenue_share_percentage || '0') / 100)) - spent < 0
              ? "text-red-500"
              : "text-green-500"
          )}>
            {formatMoney(
              (parseFloat(subcampaign.revenue_generated || '0') * (1 - parseFloat(subcampaign.revenue_share_percentage || '0') / 100)) - spent,
              subcampaign.currency
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">vs Estimate</p>
          <p className={cn(
            "font-medium",
            spent > parseFloat(subcampaign.internal_cost || '0') ? "text-red-500" : "text-green-500"
          )}>
            {spent <= parseFloat(subcampaign.internal_cost || '0') ? 'Under' : 'Over'} budget
          </p>
        </div>
      </div>
    </>
  )
}

interface ServiceFeeFieldsProps extends SubCampaignFinancialsProps {
  inputs: {
    clientValue: string
    setClientValue: (v: string) => void
    budget: string
    setBudget: (v: string) => void
    spent: string
    setSpent: (v: string) => void
    internalCost: string
    setInternalCost: (v: string) => void
  }
  onSaveField: (field: NonNullable<EditableField>) => void
}

export function ServiceFeeFields({
  subcampaign,
  editingField,
  setEditingField,
  canViewSensitiveData,
  inputs,
  onSaveField,
}: ServiceFeeFieldsProps) {
  const budget = parseFloat(subcampaign.budget)
  const spent = parseFloat(subcampaign.spent)
  const utilization = budget > 0 ? (spent / budget) * 100 : 0

  return (
    <>
      {/* Service Fee Fields */}
      <div className={cn("grid gap-4 pt-2", canViewSensitiveData ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3")}>
        {/* Client Value - Admin/Manager only */}
        {canViewSensitiveData && (
          <EditableFinancialField
            label="Client Value"
            value={subcampaign.client_value || '0'}
            inputValue={inputs.clientValue}
            setInputValue={inputs.setClientValue}
            field="client_value"
            editingField={editingField}
            setEditingField={setEditingField}
            onSave={onSaveField}
            currency={subcampaign.currency}
          />
        )}

        {/* Budget */}
        <EditableFinancialField
          label="Budget"
          value={subcampaign.budget || '0'}
          inputValue={inputs.budget}
          setInputValue={inputs.setBudget}
          field="budget"
          editingField={editingField}
          setEditingField={setEditingField}
          onSave={onSaveField}
          currency={subcampaign.currency}
        />

        {/* Spent */}
        <EditableFinancialField
          label="Spent"
          value={subcampaign.spent || '0'}
          inputValue={inputs.spent}
          setInputValue={inputs.setSpent}
          field="spent"
          editingField={editingField}
          setEditingField={setEditingField}
          onSave={onSaveField}
          currency={subcampaign.currency}
        />

        {/* Est. Cost */}
        <EditableFinancialField
          label="Est. Cost"
          value={subcampaign.internal_cost || '0'}
          inputValue={inputs.internalCost}
          setInputValue={inputs.setInternalCost}
          field="internal_cost"
          editingField={editingField}
          setEditingField={setEditingField}
          onSave={onSaveField}
          currency={subcampaign.currency}
        />
      </div>

      {/* Service Fee Calculated Fields */}
      <div className={cn("grid gap-4 pt-2 border-t border-white/5", canViewSensitiveData ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3")}>
        <div>
          <p className="text-xs text-muted-foreground">Remaining</p>
          <p className="font-medium">
            {formatMoney(budget - spent, subcampaign.currency)}
          </p>
        </div>
        {/* Margin - Admin/Manager only */}
        {canViewSensitiveData && (
          <div>
            <p className="text-xs text-muted-foreground">Margin</p>
            <p className={cn(
              "font-medium",
              parseFloat(subcampaign.client_value || '0') - parseFloat(subcampaign.internal_cost || '0') < 0
                ? "text-red-500"
                : "text-green-500"
            )}>
              {formatMoney(
                parseFloat(subcampaign.client_value || '0') - parseFloat(subcampaign.internal_cost || '0'),
                subcampaign.currency
              )}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground">Utilization</p>
          <p className={cn(
            "font-medium",
            utilization > 100 ? "text-red-500" : utilization > 80 ? "text-amber-500" : ""
          )}>
            {utilization.toFixed(0)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">vs Estimate</p>
          <p className={cn(
            "font-medium",
            spent > parseFloat(subcampaign.internal_cost || '0') ? "text-red-500" : "text-green-500"
          )}>
            {spent <= parseFloat(subcampaign.internal_cost || '0') ? 'Under' : 'Over'} budget
          </p>
        </div>
      </div>
    </>
  )
}
