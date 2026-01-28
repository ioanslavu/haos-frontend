/**
 * RecurringTasksManager - Dialog for managing recurring task templates
 */

import { useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  Search,
  User,
  Repeat,
  Settings2,
  Play,
  Pause,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseRRuleToText, type RecurringTaskTemplate } from './types'

interface RecurringTasksManagerProps {
  templates: RecurringTaskTemplate[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditTemplate: (template: RecurringTaskTemplate) => void
  onNewTemplate: () => void
  onToggleActive: (template: RecurringTaskTemplate) => void
}

export function RecurringTasksManager({
  templates,
  open,
  onOpenChange,
  onEditTemplate,
  onNewTemplate,
  onToggleActive,
}: RecurringTasksManagerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused'>('all')

  const filteredTemplates = templates.filter(template => {
    // Filter by status
    if (filterStatus === 'active' && !template.is_active) return false
    if (filterStatus === 'paused' && template.is_active) return false
    // Filter by search
    if (searchQuery && !template.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-indigo-500" />
            Manage Recurring Tasks
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 mt-2">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recurring tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>

          {/* Filter Tabs */}
          <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'all' | 'active' | 'paused')}>
            <TabsList className="h-9">
              <TabsTrigger value="all" className="text-xs">
                All ({templates.length})
              </TabsTrigger>
              <TabsTrigger value="active" className="text-xs">
                Active ({templates.filter(t => t.is_active).length})
              </TabsTrigger>
              <TabsTrigger value="paused" className="text-xs">
                Paused ({templates.filter(t => !t.is_active).length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* New Button */}
          <Button
            size="sm"
            onClick={() => {
              onOpenChange(false)
              onNewTemplate()
            }}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>

        {/* Recurring Tasks List */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-2 min-h-0">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                "hover:bg-muted/50 hover:border-indigo-500/30",
                !template.is_active && "opacity-60"
              )}
            >
              {/* Priority indicator */}
              <div className={cn(
                "w-1 h-12 rounded-full flex-shrink-0",
                template.default_priority === 4 ? 'bg-red-500' :
                template.default_priority === 3 ? 'bg-orange-500' :
                template.default_priority === 2 ? 'bg-blue-500' :
                'bg-gray-400'
              )} />

              {/* Content */}
              <div
                className="flex-1 min-w-0"
                onClick={() => {
                  onOpenChange(false)
                  onEditTemplate(template)
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{template.title}</span>
                  <Badge
                    variant={template.is_active ? "default" : "secondary"}
                    className={cn(
                      "text-[10px] px-1.5 py-0",
                      template.is_active ? "bg-green-500/10 text-green-600 border-green-500/20" : ""
                    )}
                  >
                    {template.is_active ? 'Active' : 'Paused'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {parseRRuleToText(template.recurrence_rule)}
                  </span>
                  {template.next_generation_at && template.is_active && (
                    <span className="text-xs text-muted-foreground">
                      Next: {format(new Date(template.next_generation_at), 'MMM d, yyyy')}
                    </span>
                  )}
                  {template.default_assignees_detail && template.default_assignees_detail.length > 0 && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {template.default_assignees_detail.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleActive(template)
                  }}
                  className="h-8 w-8 p-0"
                  title={template.is_active ? 'Pause' : 'Activate'}
                >
                  {template.is_active ? (
                    <Pause className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Play className="h-4 w-4 text-green-500" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenChange(false)
                    onEditTemplate(template)
                  }}
                  className="h-8 w-8 p-0"
                  title="Edit"
                >
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}

          {/* Empty state */}
          {filteredTemplates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Repeat className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {searchQuery
                  ? 'No recurring tasks match your search'
                  : filterStatus === 'active'
                  ? 'No active recurring tasks'
                  : filterStatus === 'paused'
                  ? 'No paused recurring tasks'
                  : 'No recurring tasks yet'}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
