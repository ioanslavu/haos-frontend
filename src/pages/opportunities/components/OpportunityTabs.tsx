/**
 * OpportunityTabs - Tab navigation for opportunity detail
 */

import {
  Activity,
  Award,
  CheckSquare,
  FileText,
  Package,
  Receipt,
  Settings,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Opportunity } from '@/types/opportunities'

interface OpportunityTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  opportunity: Opportunity
}

export function OpportunityTabs({ activeTab, onTabChange, opportunity }: OpportunityTabsProps) {
  const tabTriggerClass =
    'rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs'

  const artistCount = opportunity.artists?.length || 0
  const deliverableCount = opportunity.deliverables?.length || 0

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-4">
      <TabsList className="grid w-full grid-cols-8 p-2 bg-muted/50 backdrop-blur-xl rounded-2xl border border-white/10 h-12 shadow-lg">
        <TabsTrigger value="overview" className={tabTriggerClass}>
          <Settings className="h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="artists" className={tabTriggerClass}>
          <Users className="h-4 w-4" />
          Artists
          {artistCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 text-[10px]">
              {artistCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="deliverables" className={tabTriggerClass}>
          <Package className="h-4 w-4" />
          Deliverables
          {deliverableCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 text-[10px]">
              {deliverableCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="approvals" className={tabTriggerClass}>
          <Award className="h-4 w-4" />
          Approvals
        </TabsTrigger>
        <TabsTrigger value="contracts" className={tabTriggerClass}>
          <FileText className="h-4 w-4" />
          Contracts
        </TabsTrigger>
        <TabsTrigger value="invoices" className={tabTriggerClass}>
          <Receipt className="h-4 w-4" />
          Invoices
        </TabsTrigger>
        <TabsTrigger value="tasks" className={tabTriggerClass}>
          <CheckSquare className="h-4 w-4" />
          Tasks
        </TabsTrigger>
        <TabsTrigger value="activity" className={tabTriggerClass}>
          <Activity className="h-4 w-4" />
          Activity
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
