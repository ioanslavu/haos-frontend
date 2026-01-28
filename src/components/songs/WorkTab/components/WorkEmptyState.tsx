/**
 * WorkEmptyState - Empty state when no work is linked
 */

import { FileText, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface WorkEmptyStateProps {
  onCreateClick: () => void
}

export function WorkEmptyState({ onCreateClick }: WorkEmptyStateProps) {
  return (
    <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Musical Work
        </CardTitle>
        <CardDescription>
          Link or create a musical work for publishing administration
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="text-center py-12">
          <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
            <FileText className="h-12 w-12 text-primary opacity-50" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Work Linked</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            A musical work represents the composition and lyrics. Link an existing work or create a
            new one to manage publishing rights.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={onCreateClick}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Work
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
