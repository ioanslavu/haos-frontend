/**
 * WorkDetailsView - Details view for an existing work
 */

import {
  FileText,
  Edit,
  Plus,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkCreditsTab } from './WorkCreditsTab'
import { WorkSplitsTab } from './WorkSplitsTab'

interface WorkDetailsViewProps {
  work: any
  credits: any[] | undefined
  writerSplits: any[] | undefined
  publisherSplits: any[] | undefined
  writerTotal: number
  publisherTotal: number
  onEditClick: () => void
  onAddISWC: () => void
  onAddCredit: () => void
  onEditCredit: (credit: any) => void
  onDeleteCredit: (creditId: number) => void
  onAddWriterSplit: () => void
  onAddPublisherSplit: () => void
}

export function WorkDetailsView({
  work,
  credits,
  writerSplits,
  publisherSplits,
  writerTotal,
  publisherTotal,
  onEditClick,
  onAddISWC,
  onAddCredit,
  onEditCredit,
  onDeleteCredit,
  onAddWriterSplit,
  onAddPublisherSplit,
}: WorkDetailsViewProps) {
  if (!work) {
    return (
      <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
          <p className="text-muted-foreground">Unable to load work details</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Work Details Card */}
      <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Musical Work
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </CardTitle>
              <CardDescription>Publishing composition and rights information</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onEditClick}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card className="backdrop-blur-xl bg-background/80 border-white/10 shadow-lg rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  ISWC Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                {work.iswc ? (
                  <div className="text-2xl font-bold font-mono">{work.iswc}</div>
                ) : (
                  <Button size="sm" variant="outline" onClick={onAddISWC}>
                    <Plus className="h-3 w-3 mr-1" /> Add ISWC
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-background/80 border-white/10 shadow-lg rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Credits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{credits?.length || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Contributors</p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-background/80 border-white/10 shadow-lg rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Publishing
                </CardTitle>
              </CardHeader>
              <CardContent>
                {work.has_complete_publishing_splits ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      Complete
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      Incomplete
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Tabs */}
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="credits">Credits</TabsTrigger>
              <TabsTrigger value="splits">Publishing Splits</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Work Title
                  </p>
                  <p className="font-semibold text-lg">{work.title || 'Untitled Work'}</p>
                </div>

                {work.language && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Language</p>
                    <p className="text-lg">{work.language}</p>
                  </div>
                )}

                {work.genre && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Genre</p>
                    <Badge variant="secondary">{work.genre}</Badge>
                  </div>
                )}

                {work.year_composed && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Year Composed</p>
                    <p className="text-lg">{work.year_composed}</p>
                  </div>
                )}
              </div>

              {work.lyrics && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Lyrics</p>
                  <div className="p-4 bg-accent/30 rounded-lg">
                    <pre className="text-sm font-mono whitespace-pre-wrap">{work.lyrics}</pre>
                  </div>
                </div>
              )}

              {work.notes && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Internal Notes</p>
                  <div className="p-4 bg-accent/30 rounded-lg">
                    <p className="text-sm">{work.notes}</p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Credits Tab */}
            <TabsContent value="credits">
              <WorkCreditsTab
                credits={credits}
                onAddCredit={onAddCredit}
                onEditCredit={onEditCredit}
                onDeleteCredit={onDeleteCredit}
              />
            </TabsContent>

            {/* Splits Tab */}
            <TabsContent value="splits">
              <WorkSplitsTab
                writerSplits={writerSplits}
                publisherSplits={publisherSplits}
                writerTotal={writerTotal}
                publisherTotal={publisherTotal}
                onAddWriterSplit={onAddWriterSplit}
                onAddPublisherSplit={onAddPublisherSplit}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
