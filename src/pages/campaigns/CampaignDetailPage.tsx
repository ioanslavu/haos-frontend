/**
 * CampaignDetailPage - Detailed view of a single campaign
 *
 * Features:
 * - Status workflow visualization with clickable progression
 * - Budget overview with payment tracking
 * - Tabbed interface for Overview, Platforms, Tasks, Contracts, Invoices, History
 */

import {
  CheckSquare,
  FileText,
  History,
  Loader2,
  Receipt,
  Settings,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'
import { HiSquares2X2 } from 'react-icons/hi2'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCampaignDetail } from './hooks'
import {
  CampaignHeader,
  OverviewTab,
  SubCampaignsTab,
  ContractsTab,
  InvoicesTab,
  HistoryTab,
  SendForSignatureDialog,
  CampaignDialogs,
} from './components/detail'
import { CampaignTasksTab } from './components/CampaignTasksTab'

export default function CampaignDetailPage() {
  const ctx = useCampaignDetail()
  const {
    campaign,
    isLoading,
    error,
    navigate,
    activeTab,
    setActiveTab,
  } = ctx

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  // Error state
  if (error || !campaign) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Campaign not found</h2>
          <p className="text-muted-foreground mb-4">
            The campaign you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => navigate('/campaigns')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <CampaignHeader ctx={ctx} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 p-2 bg-muted/50 backdrop-blur-xl rounded-2xl border border-white/10 h-12 shadow-lg">
            <TabsTrigger
              value="overview"
              className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
            >
              <Settings className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="subcampaigns"
              className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
            >
              <HiSquares2X2 className="h-4 w-4" />
              Platforms
              {campaign.subcampaign_count !== undefined && campaign.subcampaign_count > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {campaign.subcampaign_count}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
            >
              <CheckSquare className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger
              value="contracts"
              className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
            >
              <FileText className="h-4 w-4" />
              Contracts
            </TabsTrigger>
            <TabsTrigger
              value="invoices"
              className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
            >
              <Receipt className="h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
            >
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab ctx={ctx} />
          </TabsContent>

          <TabsContent value="subcampaigns" className="mt-6">
            <SubCampaignsTab ctx={ctx} />
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <CampaignTasksTab campaignId={ctx.campaignId} />
          </TabsContent>

          <TabsContent value="contracts" className="mt-6">
            <ContractsTab ctx={ctx} />
          </TabsContent>

          <TabsContent value="invoices" className="mt-6">
            <InvoicesTab ctx={ctx} />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <HistoryTab ctx={ctx} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <SendForSignatureDialog ctx={ctx} />
      <CampaignDialogs ctx={ctx} />
    </AppLayout>
  )
}
