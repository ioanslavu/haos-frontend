import { forwardRef } from 'react'

interface TaskHeaderProps {
  localTitle: string
  setLocalTitle: (value: string) => void
  localDescription: string
  setLocalDescription: (value: string) => void
  isCreateMode: boolean
}

export const TaskHeader = forwardRef<HTMLInputElement, TaskHeaderProps>(({
  localTitle,
  setLocalTitle,
  localDescription,
  setLocalDescription,
  isCreateMode,
}, ref) => {
  return (
    <>
      {/* Title - Large and Prominent (Notion style) */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider pl-1">
          Title {isCreateMode && '*'}
        </label>
        <input
          ref={ref}
          type="text"
          placeholder={isCreateMode ? "Task title..." : "Task title"}
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          className="w-full text-3xl font-bold bg-transparent px-1 py-2 placeholder:text-muted-foreground/30"
          style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
          onFocus={(e) => e.target.style.outline = 'none'}
        />
        {isCreateMode && !localTitle && (
          <p className="text-xs text-muted-foreground/70 pl-1">
            Start typing to create the task...
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider pl-1">
          Description
        </label>
        <textarea
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          placeholder="Add a description..."
          rows={3}
          className="w-full text-sm bg-transparent px-1 py-2 placeholder:text-muted-foreground/30 resize-none"
          style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
          onFocus={(e) => e.target.style.outline = 'none'}
        />
      </div>
    </>
  )
})

TaskHeader.displayName = 'TaskHeader'
