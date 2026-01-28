/**
 * DistributionTabs - Tab navigation for distribution detail
 */

import {
  ClipboardList,
  FileText,
  History,
  Music,
  Receipt,
  Settings,
  TrendingUp,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface DistributionTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  songCount: number
}

export function DistributionTabs({ activeTab, onTabChange, songCount }: DistributionTabsProps) {
  const tabTriggerClass = "rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-4">
      <TabsList className="grid w-full grid-cols-7 p-2 bg-muted/50 backdrop-blur-xl rounded-2xl border border-white/10 h-12 shadow-lg">
        <TabsTrigger value="overview" className={tabTriggerClass}>
          <Settings className="h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="catalog" className={tabTriggerClass}>
          <Music className="h-4 w-4" />
          Songs
          <Badge variant="secondary" className="ml-1 h-5 text-[10px]">
            {songCount}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="revenue" className={tabTriggerClass}>
          <TrendingUp className="h-4 w-4" />
          Revenue
        </TabsTrigger>
        <TabsTrigger value="invoices" className={tabTriggerClass}>
          <Receipt className="h-4 w-4" />
          Invoices
        </TabsTrigger>
        <TabsTrigger value="contracts" className={tabTriggerClass}>
          <FileText className="h-4 w-4" />
          Contracts
        </TabsTrigger>
        <TabsTrigger value="tasks" className={tabTriggerClass}>
          <ClipboardList className="h-4 w-4" />
          Tasks
        </TabsTrigger>
        <TabsTrigger value="audit" className={tabTriggerClass}>
          <History className="h-4 w-4" />
          Audit
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
