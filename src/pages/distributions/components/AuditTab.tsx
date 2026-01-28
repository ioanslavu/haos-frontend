/**
 * AuditTab - Audit log placeholder (Coming Soon)
 */

import { History } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function AuditTab() {
  return (
    <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
      <CardContent className="p-12 text-center">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-4">
          <History className="h-8 w-8 text-emerald-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Audit Log Coming Soon</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          View complete history of changes to this distribution. Track who made changes, when, and what was modified for compliance.
        </p>
        <Badge variant="outline" className="mt-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
          In Development
        </Badge>
      </CardContent>
    </Card>
  )
}
