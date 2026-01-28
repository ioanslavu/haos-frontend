/**
 * WorkSplitsTab - Publishing splits management for a work
 */

import { Music, DollarSign, Plus, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Split {
  id: number
  entity_name?: string
  share: number
  territory?: string
}

interface SplitSectionProps {
  title: string
  icon: React.ReactNode
  splits: Split[] | undefined
  total: number
  onAddSplit: () => void
  emptyLabel: string
}

function SplitSection({ title, icon, splits, total, onAddSplit, emptyLabel }: SplitSectionProps) {
  const isComplete = Math.abs(total - 100) < 0.01

  return (
    <Card className="backdrop-blur-xl bg-background/80 border-white/10 shadow-lg rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={total} className="w-32" />
              <span className="text-sm font-medium">{total.toFixed(1)}%</span>
              {isComplete ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
            </div>
          </div>
          <Button size="sm" onClick={onAddSplit}>
            <Plus className="h-4 w-4 mr-2" />
            Add Split
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {splits && splits.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{title.replace(' Splits', '')}</TableHead>
                <TableHead>Share</TableHead>
                <TableHead>Territory</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {splits.map((split) => (
                <TableRow key={split.id}>
                  <TableCell className="font-medium">{split.entity_name || 'Unknown'}</TableCell>
                  <TableCell>
                    <Badge>{split.share}%</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {split.territory || 'Worldwide'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground">No {emptyLabel.toLowerCase()} defined</p>
            <Button className="mt-4" onClick={onAddSplit}>
              <Plus className="h-4 w-4 mr-2" />
              Add {emptyLabel}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface WorkSplitsTabProps {
  writerSplits: Split[] | undefined
  publisherSplits: Split[] | undefined
  writerTotal: number
  publisherTotal: number
  onAddWriterSplit: () => void
  onAddPublisherSplit: () => void
}

export function WorkSplitsTab({
  writerSplits,
  publisherSplits,
  writerTotal,
  publisherTotal,
  onAddWriterSplit,
  onAddPublisherSplit,
}: WorkSplitsTabProps) {
  return (
    <div className="space-y-6">
      <SplitSection
        title="Writer Splits"
        icon={<Music className="h-5 w-5" />}
        splits={writerSplits}
        total={writerTotal}
        onAddSplit={onAddWriterSplit}
        emptyLabel="Writer Split"
      />

      <SplitSection
        title="Publisher Splits"
        icon={<DollarSign className="h-5 w-5" />}
        splits={publisherSplits}
        total={publisherTotal}
        onAddSplit={onAddPublisherSplit}
        emptyLabel="Publisher Split"
      />
    </div>
  )
}
