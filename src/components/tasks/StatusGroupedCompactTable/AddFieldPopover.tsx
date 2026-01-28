import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { TableHead } from '@/components/ui/table'
import {
  Plus,
  Type,
  Hash,
  List,
  Calendar,
  CheckSquare,
  X,
} from 'lucide-react'
import { useCreateProjectCustomFieldDefinition } from '@/api/hooks/useCustomFields'
import type { CustomFieldType } from '@/api/types/customFields'

interface AddFieldPopoverProps {
  projectId: number
  customFieldDefinitionsCount: number
}

export function AddFieldPopover({ projectId, customFieldDefinitionsCount }: AddFieldPopoverProps) {
  const [addFieldOpen, setAddFieldOpen] = useState(false)
  const [newFieldType, setNewFieldType] = useState<CustomFieldType | null>(null)
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldOptions, setNewFieldOptions] = useState<string[]>([])
  const [newOptionInput, setNewOptionInput] = useState('')

  const createFieldMutation = useCreateProjectCustomFieldDefinition()

  const handleCreateField = () => {
    if (!projectId || !newFieldType || !newFieldName.trim()) return

    let finalOptions = newFieldOptions
    if (newFieldType === 'single_select' && newOptionInput.trim() && !newFieldOptions.includes(newOptionInput.trim())) {
      finalOptions = [...newFieldOptions, newOptionInput.trim()]
    }

    createFieldMutation.mutate(
      {
        projectId,
        data: {
          field_name: newFieldName.trim(),
          field_type: newFieldType,
          select_options: newFieldType === 'single_select' ? finalOptions : undefined,
          show_in_table: true,
        },
      },
      {
        onSuccess: () => {
          setAddFieldOpen(false)
          setNewFieldType(null)
          setNewFieldName('')
          setNewFieldOptions([])
          setNewOptionInput('')
        },
      }
    )
  }

  const cancelAddField = () => {
    setAddFieldOpen(false)
    setNewFieldType(null)
    setNewFieldName('')
    setNewFieldOptions([])
    setNewOptionInput('')
  }

  if (customFieldDefinitionsCount >= 20) {
    return null
  }

  return (
    <TableHead className="py-2 w-[40px]">
      <Popover open={addFieldOpen} onOpenChange={setAddFieldOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="end">
          {!newFieldType ? (
            <div className="p-1">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Add property</div>
              {[
                { type: 'text' as CustomFieldType, label: 'Text', icon: <Type className="h-4 w-4" /> },
                { type: 'number' as CustomFieldType, label: 'Number', icon: <Hash className="h-4 w-4" /> },
                { type: 'single_select' as CustomFieldType, label: 'Select', icon: <List className="h-4 w-4" /> },
                { type: 'date' as CustomFieldType, label: 'Date', icon: <Calendar className="h-4 w-4" /> },
                { type: 'checkbox' as CustomFieldType, label: 'Checkbox', icon: <CheckSquare className="h-4 w-4" /> },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => setNewFieldType(item.type)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted rounded"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 space-y-3">
              <Input
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                placeholder="Property name"
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFieldName.trim()) {
                    if (newFieldType !== 'single_select' || newFieldOptions.length > 0) {
                      handleCreateField()
                    }
                  }
                  if (e.key === 'Escape') cancelAddField()
                }}
              />
              {newFieldType === 'single_select' && (
                <div className="space-y-1.5">
                  <div className="text-xs text-muted-foreground">Options</div>
                  {newFieldOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <Input value={option} disabled className="h-7 text-sm flex-1" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setNewFieldOptions(newFieldOptions.filter((_, i) => i !== index))}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-1">
                    <Input
                      value={newOptionInput}
                      onChange={(e) => setNewOptionInput(e.target.value)}
                      placeholder="Add option..."
                      className="h-7 text-sm flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (newOptionInput.trim() && !newFieldOptions.includes(newOptionInput.trim())) {
                            setNewFieldOptions([...newFieldOptions, newOptionInput.trim()])
                            setNewOptionInput('')
                          }
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7"
                      onClick={() => {
                        if (newOptionInput.trim() && !newFieldOptions.includes(newOptionInput.trim())) {
                          setNewFieldOptions([...newFieldOptions, newOptionInput.trim()])
                          setNewOptionInput('')
                        }
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" size="sm" className="h-7" onClick={cancelAddField}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7"
                  onClick={handleCreateField}
                  disabled={
                    !newFieldName.trim() ||
                    (newFieldType === 'single_select' && newFieldOptions.length === 0) ||
                    createFieldMutation.isPending
                  }
                >
                  Create
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </TableHead>
  )
}
