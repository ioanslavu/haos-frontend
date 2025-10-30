import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  Zap,
  ArrowRight,
} from 'lucide-react'
import { Campaign, CampaignStatus } from '@/types/campaign'
import { format, differenceInDays } from 'date-fns'

interface SmartInsightsDashboardProps {
  campaigns: Campaign[]
  onCampaignClick?: (campaign: Campaign) => void
}

interface Insight {
  id: string
  type: 'success' | 'warning' | 'danger' | 'info'
  title: string
  description: string
  icon: React.ElementType
  action?: {
    label: string
    onClick: () => void
  }
  campaign?: Campaign
}

export function SmartInsightsDashboard({
  campaigns,
  onCampaignClick,
}: SmartInsightsDashboardProps) {
  const insights = useMemo(() => {
    const results: Insight[] = []

    // Find stalled campaigns (in negotiation for > 30 days)
    const stalledCampaigns = campaigns.filter((c) => {
      if (c.status !== 'negotiation') return false
      const daysSinceCreated = differenceInDays(new Date(), new Date(c.created_at))
      return daysSinceCreated > 30
    })

    if (stalledCampaigns.length > 0) {
      results.push({
        id: 'stalled',
        type: 'warning',
        title: `${stalledCampaigns.length} Stalled Campaign${stalledCampaigns.length > 1 ? 's' : ''}`,
        description: `Campaign${stalledCampaigns.length > 1 ? 's have' : ' has'} been in negotiation for over 30 days`,
        icon: AlertTriangle,
        campaign: stalledCampaigns[0],
      })
    }

    // Find campaigns about to close (confirmed in last 7 days)
    const recentlyConfirmed = campaigns.filter((c) => {
      if (c.status !== 'confirmed' || !c.confirmed_at) return false
      const daysSinceConfirmed = differenceInDays(new Date(), new Date(c.confirmed_at))
      return daysSinceConfirmed <= 7
    })

    if (recentlyConfirmed.length > 0) {
      results.push({
        id: 'recent-wins',
        type: 'success',
        title: `${recentlyConfirmed.length} Recent Win${recentlyConfirmed.length > 1 ? 's' : ''}`,
        description: `Campaign${recentlyConfirmed.length > 1 ? 's' : ''} confirmed in the last 7 days`,
        icon: CheckCircle2,
      })
    }

    // Calculate conversion rate
    const leads = campaigns.filter((c) => c.status === 'lead').length
    const won = campaigns.filter((c) => c.status === 'confirmed' || c.status === 'completed').length
    const lost = campaigns.filter((c) => c.status === 'lost').length

    if (leads > won && leads > 5) {
      results.push({
        id: 'low-conversion',
        type: 'info',
        title: 'Focus on Lead Conversion',
        description: `You have ${leads} leads. Consider prioritizing nurturing activities.`,
        icon: Target,
      })
    }

    // High-value active campaigns
    const highValueActive = campaigns.filter((c) => {
      return c.status === 'active' && parseFloat(c.value) > 50000
    })

    if (highValueActive.length > 0) {
      const totalValue = highValueActive.reduce((sum, c) => sum + parseFloat(c.value), 0)
      results.push({
        id: 'high-value',
        type: 'success',
        title: 'High-Value Campaigns Active',
        description: `${highValueActive.length} campaign${highValueActive.length > 1 ? 's' : ''} worth $${(totalValue / 1000).toFixed(0)}k currently running`,
        icon: TrendingUp,
      })
    }

    // Urgent follow-ups (leads older than 14 days)
    const urgentLeads = campaigns.filter((c) => {
      if (c.status !== 'lead') return false
      const daysSinceCreated = differenceInDays(new Date(), new Date(c.created_at))
      return daysSinceCreated > 14
    })

    if (urgentLeads.length > 0) {
      results.push({
        id: 'urgent-leads',
        type: 'danger',
        title: 'Urgent Follow-ups Required',
        description: `${urgentLeads.length} lead${urgentLeads.length > 1 ? 's' : ''} without activity for over 2 weeks`,
        icon: Clock,
        campaign: urgentLeads[0],
      })
    }

    // Performance insight
    const totalActive = campaigns.filter(
      (c) => c.status !== 'completed' && c.status !== 'lost'
    ).length

    if (totalActive > 20) {
      results.push({
        id: 'high-workload',
        type: 'info',
        title: 'High Pipeline Activity',
        description: `You're managing ${totalActive} active campaigns. Great momentum!`,
        icon: Zap,
      })
    }

    return results
  }, [campaigns])

  const getInsightStyles = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-950/20',
          border: 'border-green-200 dark:border-green-900',
          icon: 'text-green-600 dark:text-green-400',
          badge: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        }
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/20',
          border: 'border-amber-200 dark:border-amber-900',
          icon: 'text-amber-600 dark:text-amber-400',
          badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
        }
      case 'danger':
        return {
          bg: 'bg-red-50 dark:bg-red-950/20',
          border: 'border-red-200 dark:border-red-900',
          icon: 'text-red-600 dark:text-red-400',
          badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
        }
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/20',
          border: 'border-blue-200 dark:border-blue-900',
          icon: 'text-blue-600 dark:text-blue-400',
          badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        }
    }
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Smart Insights
          </CardTitle>
          <CardDescription>AI-powered recommendations for your pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
            <p className="text-sm font-medium">All clear!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your pipeline is healthy. Keep up the good work!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Smart Insights
        </CardTitle>
        <CardDescription>AI-powered recommendations for your pipeline</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight) => {
            const styles = getInsightStyles(insight.type)
            const Icon = insight.icon

            return (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border ${styles.bg} ${styles.border} transition-all hover:shadow-md`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${styles.icon}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm">{insight.title}</h4>
                      <Badge variant="secondary" className={styles.badge}>
                        {insight.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    {insight.campaign && onCampaignClick && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-8"
                        onClick={() => onCampaignClick(insight.campaign!)}
                      >
                        View Campaign
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
