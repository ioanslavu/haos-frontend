import { useState } from 'react';
import { Tag } from '@/types/notes';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Plus, Check } from 'lucide-react';
import { useTags, useCreateTag } from '@/api/hooks/useNotes';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
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
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            style={{ backgroundColor: tag.color + '20', color: tag.color }}
            className="pl-2 pr-1"
          >
            {tag.name}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-4 w-4 ml-1 hover:bg-transparent"
              onClick={() => handleRemoveTag(tag.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search or create tag..."
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                {filteredTags.length === 0 && !showCreateOption && (
                  <CommandEmpty>No tags found.</CommandEmpty>
                )}
                {showCreateOption && (
                  <CommandGroup>
                    <CommandItem
                      onSelect={handleCreateTag}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleCreateTag();
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create "{searchValue}"
                    </CommandItem>
                  </CommandGroup>
                )}
                {filteredTags.length > 0 && (
                  <CommandGroup>
                    {filteredTags.map((tag) => (
                      <CommandItem
                        key={tag.id}
                        onSelect={() => handleAddTag(tag)}
                      >
                        <Badge
                          variant="secondary"
                          style={{ backgroundColor: tag.color + '20', color: tag.color }}
                        >
                          {tag.name}
                        </Badge>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
