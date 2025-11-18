import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskInputFieldTemplate {
  id: number;
  field_name: string;
  field_label: string;
  field_type: string;
  placeholder?: string;
  help_text?: string;
  required: boolean;
  validation_rules?: any;
  max_file_size_mb?: number;
  allowed_file_types?: string[];
  select_options?: string[];
}

interface TaskInputFieldsProps {
  fields: TaskInputFieldTemplate[];
  values: Record<string, any>;
  onChange: (fieldName: string, value: any) => void;
  errors?: Record<string, string>;
}

export function TaskInputFields({ fields, values, onChange, errors }: TaskInputFieldsProps) {
  const renderField = (field: TaskInputFieldTemplate) => {
    const value = values[field.field_name];
    const error = errors?.[field.field_name];

    switch (field.field_type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.field_name}>
              {field.field_label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.field_name}
              value={value || ''}
              onChange={(e) => onChange(field.field_name, e.target.value)}
              placeholder={field.placeholder}
              className={error ? 'border-destructive' : ''}
            />
            {field.help_text && (
              <p className="text-xs text-muted-foreground">{field.help_text}</p>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.field_name}>
              {field.field_label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={field.field_name}
              value={value || ''}
              onChange={(e) => onChange(field.field_name, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className={error ? 'border-destructive' : ''}
            />
            {field.help_text && (
              <p className="text-xs text-muted-foreground">{field.help_text}</p>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        );

      case 'url':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.field_name}>
              {field.field_label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.field_name}
              type="url"
              value={value || ''}
              onChange={(e) => onChange(field.field_name, e.target.value)}
              placeholder={field.placeholder || 'https://...'}
              className={error ? 'border-destructive' : ''}
            />
            {field.help_text && (
              <p className="text-xs text-muted-foreground">{field.help_text}</p>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.field_name}>
              {field.field_label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.field_name}
              type="number"
              value={value || ''}
              onChange={(e) => onChange(field.field_name, parseFloat(e.target.value))}
              placeholder={field.placeholder}
              className={error ? 'border-destructive' : ''}
            />
            {field.help_text && (
              <p className="text-xs text-muted-foreground">{field.help_text}</p>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.field_name}>
              {field.field_label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !value && 'text-muted-foreground',
                    error && 'border-destructive'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {value ? format(new Date(value), 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={value ? new Date(value) : undefined}
                  onSelect={(date) => onChange(field.field_name, date?.toISOString())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {field.help_text && (
              <p className="text-xs text-muted-foreground">{field.help_text}</p>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor={field.field_name}>{field.field_label}</Label>
              {field.help_text && (
                <p className="text-xs text-muted-foreground">{field.help_text}</p>
              )}
            </div>
            <Switch
              id={field.field_name}
              checked={!!value}
              onCheckedChange={(checked) => onChange(field.field_name, checked)}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.field_name}>
              {field.field_label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={value || ''}
              onValueChange={(val) => onChange(field.field_name, val)}
            >
              <SelectTrigger className={error ? 'border-destructive' : ''}>
                <SelectValue placeholder={field.placeholder || 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {field.select_options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.help_text && (
              <p className="text-xs text-muted-foreground">{field.help_text}</p>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        );

      case 'file_upload':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.field_name}>
              {field.field_label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id={field.field_name}
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onChange(field.field_name, file);
                  }
                }}
                accept={field.allowed_file_types?.join(',')}
                className={error ? 'border-destructive' : ''}
              />
              {value && (
                <span className="text-sm text-muted-foreground">
                  {typeof value === 'string' ? value : value.name}
                </span>
              )}
            </div>
            {field.help_text && (
              <p className="text-xs text-muted-foreground">{field.help_text}</p>
            )}
            {field.max_file_size_mb && (
              <p className="text-xs text-muted-foreground">
                Max file size: {field.max_file_size_mb}MB
              </p>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {fields.map((field) => renderField(field))}
    </div>
  );
}
