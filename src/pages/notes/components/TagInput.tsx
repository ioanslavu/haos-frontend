import { useState } from 'react';
import { Tag } from '@/types/notes';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Plus, Check } from 'lucide-react';
import { useTags, useCreateTag } from '@/api/hooks/useNotes';
import { Command, CommandInput } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface TagInputProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export const TagInput = ({ selectedTags, onTagsChange }: TagInputProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const { data: allTags = [] } = useTags();
  const createTag = useCreateTag();

  const availableTags = allTags.filter(
    (tag) => !selectedTags.find((selected) => selected.id === tag.id)
  );

  const filteredTags = searchValue
    ? availableTags.filter((tag) => tag.name.toLowerCase().includes(searchValue.toLowerCase()))
    : availableTags;

  const handleRemoveTag = (tagId: number) => {
    onTagsChange(selectedTags.filter((tag) => tag.id !== tagId));
  };

  const handleAddTag = (tag: Tag) => {
    onTagsChange([...selectedTags, tag]);
    setOpen(false);
    setSearchValue('');
  };

  const handleCreateTag = async () => {
    if (!searchValue.trim()) return;

    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    createTag.mutate(
      { name: searchValue.trim(), color: randomColor },
      {
        onSuccess: (response) => {
          handleAddTag(response.data);
        },
      }
    );
  };

  const showCreateOption = searchValue && !filteredTags.some(tag => tag.name.toLowerCase() === searchValue.toLowerCase());

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            style={{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color + '40' }}
            className="pl-2.5 pr-1 py-1 border"
          >
            {tag.name}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-4 w-4 ml-1.5 hover:bg-transparent opacity-60 hover:opacity-100"
              onClick={() => handleRemoveTag(tag.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        <Popover open={open} onOpenChange={setOpen} modal={true}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground border border-dashed hover:border-solid transition-all"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[250px] p-0"
            align="start"
            side="bottom"
            sideOffset={5}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Command shouldFilter={false} className="border-0">
              <CommandInput
                placeholder="Search or create tag..."
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <div className="max-h-[300px] overflow-y-auto p-2">
                {filteredTags.length === 0 && !showCreateOption && (
                  <div className="py-6 text-center text-sm text-muted-foreground">No tags found.</div>
                )}
                {showCreateOption && (
                  <div
                    role="button"
                    tabIndex={0}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCreateTag();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-md hover:bg-accent cursor-pointer transition-colors text-left"
                  >
                    <Plus className="h-4 w-4" />
                    Create "{searchValue}"
                  </div>
                )}
                {filteredTags.length > 0 && (
                  <div className="space-y-1">
                    {filteredTags.map((tag) => (
                      <div
                        key={tag.id}
                        role="button"
                        tabIndex={0}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddTag(tag);
                        }}
                        className="w-full flex items-start gap-2 px-3 py-2.5 text-sm rounded-md hover:bg-accent cursor-pointer transition-colors text-left"
                      >
                        <Badge
                          variant="secondary"
                          style={{ backgroundColor: tag.color + '20', color: tag.color }}
                        >
                          {tag.name}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
