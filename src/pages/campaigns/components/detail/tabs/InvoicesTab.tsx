/**
 * InvoicesTab - Invoice management and financial tracking
 */

import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  ExternalLink,
  FileText,
  Loader2,
  Receipt,
  Target,
} from 'lucide-react'
import { HiSquares2X2 } from 'react-icons/hi2'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatMoney, cn } from '@/lib/utils'
import { PLATFORM_ICONS, PLATFORM_COLORS } from '@/lib/platform-icons'
import { PLATFORM_CONFIG } from '@/types/campaign'
import type { UseCampaignDetailReturn } from '../../../hooks/useCampaignDetail'

interface InvoicesTabProps {
  ctx: UseCampaignDetailReturn
}

export function InvoicesTab({ ctx }: InvoicesTabProps) {
  const {
    campaign,
    invoiceData,
    navigate,
    expandedPlatformId,
    setExpandedPlatformId,
  } = ctx

  if (!campaign) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">Invoices & Payments</h3>
          <p className="text-sm text-muted-foreground">
            Track income from client and expenses to platforms
          </p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FinancialCard
          icon={<ArrowDownLeft className="h-4 w-4 text-emerald-500" />}
          iconBg="bg-emerald-500/20"
          label="Total Income"
          value={formatMoney(invoiceData.totalIncome, 'EUR')}
          valueColor="text-emerald-600"
          subtitle={`${invoiceData.incomeInvoices.length} invoice${invoiceData.incomeInvoices.length !== 1 ? 's' : ''}`}
        />
        <FinancialCard
          icon={<ArrowUpRight className="h-4 w-4 text-red-500" />}
          iconBg="bg-red-500/20"
          label="Total Expenses"
          value={formatMoney(invoiceData.totalExpense, 'EUR')}
          valueColor="text-red-600"
          subtitle={`${invoiceData.expenseInvoices.length} invoice${invoiceData.expenseInvoices.length !== 1 ? 's' : ''}`}
        />
        <FinancialCard
          icon={<Check className="h-4 w-4 text-blue-500" />}
          iconBg="bg-blue-500/20"
          label="Paid Profit"
          value={formatMoney(invoiceData.profit, 'EUR')}
          valueColor={invoiceData.profit >= 0 ? "text-emerald-600" : "text-red-600"}
          subtitle="received - spent"
        />
        <FinancialCard
          icon={<Target className="h-4 w-4 text-amber-500" />}
          iconBg="bg-amber-500/20"
          label="Expected Balance"
          value={formatMoney(invoiceData.balance, 'EUR')}
          valueColor={invoiceData.balance >= 0 ? "text-emerald-600" : "text-red-600"}
          subtitle="income - expenses"
        />
      </div>

      {/* Invoice Lists */}
      {invoiceData.isLoading ? (
        <Card className="p-8 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Loading invoices...</p>
        </Card>
      ) : invoiceData.incomeInvoices.length === 0 && invoiceData.expenseInvoices.length === 0 ? (
        <Card className="p-12 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <Receipt className="h-8 w-8 text-emerald-500" />
          </div>
          <h4 className="font-semibold mb-2">No invoices yet</h4>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Upload invoices to platforms to track expenses and payments.
            Go to Platforms tab and add invoices to each platform.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income Invoices */}
          <Card className="p-5 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm">
            <h4 className="font-semibold mb-4 flex items-center gap-2 text-emerald-600">
              <ArrowDownLeft className="h-4 w-4" />
              Income (from Client)
            </h4>
            {invoiceData.incomeInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No income invoices</p>
            ) : (
              <div className="space-y-2">
                {invoiceData.incomeInvoices.map((inv) => (
                  <InvoiceItem
                    key={`income-${inv.id}`}
                    invoice={inv}
                    type="income"
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                  />
                ))}
              </div>
            )}
          </Card>

          {/* Expense Invoices */}
          <Card className="p-5 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm">
            <h4 className="font-semibold mb-4 flex items-center gap-2 text-red-600">
              <ArrowUpRight className="h-4 w-4" />
              Expenses (to Platforms)
            </h4>
            {invoiceData.expenseInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No expense invoices</p>
            ) : (
              <div className="space-y-2">
                {invoiceData.expenseInvoices.map((inv) => (
                  <InvoiceItem
                    key={`expense-${inv.id}`}
                    invoice={inv}
                    type="expense"
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Platform Spending Summary with Expandable Invoices */}
      {campaign.subcampaigns && campaign.subcampaigns.length > 0 && (
        <Card className="p-5 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <HiSquares2X2 className="h-4 w-4" />
            Platform Budgets & Invoices
          </h4>
          <div className="space-y-2">
            {campaign.subcampaigns.map((sub) => {
              const platformConfig = PLATFORM_CONFIG[sub.platform]
              const PlatformIcon = PLATFORM_ICONS[sub.platform]
              const brandColor = PLATFORM_COLORS[sub.platform]
              const subBudget = parseFloat(sub.budget)
              const subSpent = parseFloat(sub.spent)
              const utilizationPercent = subBudget > 0 ? (subSpent / subBudget) * 100 : 0
              const isExpanded = expandedPlatformId === sub.id

              // Get invoices for this platform
              const platformInvoices = invoiceData.subcampaignInvoices.filter(
                inv => 'subcampaign' in inv && inv.subcampaign === sub.id
              )
              const platformIncome = platformInvoices.filter(inv => inv.invoice_type === 'income')
              const platformExpenses = platformInvoices.filter(inv => inv.invoice_type === 'expense')

              return (
                <div key={sub.id} className="rounded-xl overflow-hidden">
                  {/* Platform Header - Clickable */}
                  <div
                    onClick={() => setExpandedPlatformId(isExpanded ? null : sub.id)}
                    className={cn(
                      "flex items-center justify-between p-3 cursor-pointer transition-colors",
                      isExpanded ? "bg-muted/50" : "bg-muted/30 hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        brandColor ? brandColor.split(' ')[1] : 'bg-muted'
                      )}>
                        <PlatformIcon className={cn(
                          'h-5 w-5',
                          brandColor ? brandColor.split(' ')[0] : 'text-foreground'
                        )} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{platformConfig?.label || sub.platform}</p>
                        <p className="text-xs text-muted-foreground">
                          Budget: {formatMoney(subBudget, sub.currency)} • {platformInvoices.length} invoice{platformInvoices.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-medium text-sm text-red-600">
                          {formatMoney(subSpent, sub.currency)} spent
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {utilizationPercent.toFixed(0)}% of budget
                        </p>
                      </div>
                      <ChevronDown className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        isExpanded && "rotate-180"
                      )} />
                    </div>
                  </div>

                  {/* Expanded Invoice List */}
                  {isExpanded && (
                    <div className="bg-muted/20 p-4 space-y-4 border-t border-white/5">
                      {platformInvoices.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No invoices for this platform yet
                        </p>
                      ) : (
                        <>
                          {/* Income invoices for this platform */}
                          {platformIncome.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-emerald-600 mb-2 flex items-center gap-1">
                                <ArrowDownLeft className="h-3 w-3" />
                                Income ({platformIncome.length})
                              </p>
                              <div className="space-y-1">
                                {platformIncome.map((inv) => (
                                  <MiniInvoiceItem
                                    key={`platform-income-${inv.id}`}
                                    invoice={inv}
                                    type="income"
                                    onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${inv.id}`); }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Expense invoices for this platform */}
                          {platformExpenses.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1">
                                <ArrowUpRight className="h-3 w-3" />
                                Expenses ({platformExpenses.length})
                              </p>
                              <div className="space-y-1">
                                {platformExpenses.map((inv) => (
                                  <MiniInvoiceItem
                                    key={`platform-expense-${inv.id}`}
                                    invoice={inv}
                                    type="expense"
                                    onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${inv.id}`); }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

// Sub-components

function FinancialCard({
  icon,
  iconBg,
  label,
  value,
  valueColor,
  subtitle,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string
  valueColor: string
  subtitle: string
}) {
  return (
    <Card className="p-4 rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", iconBg)}>{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={cn("text-lg font-semibold", valueColor)}>{value}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </Card>
  )
}

function InvoiceItem({
  invoice,
  type,
  onClick,
}: {
  invoice: any
  type: 'income' | 'expense'
  onClick: () => void
}) {
  const colorClass = type === 'income' ? 'text-emerald-600' : 'text-red-600'
  const iconColorClass = type === 'income' ? 'text-emerald-500' : 'text-red-500'
  const bgClass = type === 'income' ? 'bg-emerald-500/10' : 'bg-red-500/10'

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", bgClass)}>
          <FileText className={cn("h-4 w-4", iconColorClass)} />
        </div>
        <div>
          <p className="font-medium text-sm">{invoice.invoice_name || invoice.invoice_number}</p>
          <p className="text-xs text-muted-foreground">{invoice.invoice_number}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className={cn("font-medium text-sm", colorClass)}>
            {invoice.amount ? formatMoney(parseFloat(invoice.amount), invoice.currency) : 'Pending'}
          </p>
          <Badge variant={invoice.status === 'paid' ? 'default' : 'outline'} className="text-xs">
            {invoice.status_display || invoice.status}
          </Badge>
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  )
}

function MiniInvoiceItem({
  invoice,
  type,
  onClick,
}: {
  invoice: any
  type: 'income' | 'expense'
  onClick: (e: React.MouseEvent) => void
}) {
  const colorClass = type === 'income' ? 'text-emerald-600' : 'text-red-600'
  const iconColorClass = type === 'income' ? 'text-emerald-500' : 'text-red-500'

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-2 rounded-lg bg-background/50 text-sm cursor-pointer hover:bg-background/80 transition-colors group"
    >
      <div className="flex items-center gap-2">
        <FileText className={cn("h-3.5 w-3.5", iconColorClass)} />
        <span>{invoice.invoice_name || invoice.invoice_number}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("font-medium", colorClass)}>
          {invoice.amount ? formatMoney(parseFloat(invoice.amount), invoice.currency) : 'Pending'}
        </span>
        <Badge variant={invoice.status === 'paid' ? 'default' : 'outline'} className="text-xs">
          {invoice.status}
        </Badge>
        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  )
}
