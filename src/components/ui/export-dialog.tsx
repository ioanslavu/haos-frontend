import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileSpreadsheet, FileText, FileJson, Loader2 } from 'lucide-react';

export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  data: any[];
  filename?: string;
  availableFormats?: ExportFormat[];
}

export function ExportDialog({
  open,
  onOpenChange,
  title = 'Export Data',
  data,
  filename = 'export',
  availableFormats = ['csv', 'excel', 'pdf', 'json'],
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const formatIcons = {
    csv: FileText,
    excel: FileSpreadsheet,
    pdf: FileText,
    json: FileJson,
  };

  const formatLabels = {
    csv: 'CSV',
    excel: 'Excel (.xlsx)',
    pdf: 'PDF Document',
    json: 'JSON',
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Simulate export delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create export based on format
      switch (format) {
        case 'csv':
          exportToCSV();
          break;
        case 'excel':
          // Excel export not yet implemented
          break;
        case 'pdf':
          // PDF export not yet implemented
          break;
        case 'json':
          exportToJSON();
          break;
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    if (!data || data.length === 0) return;

    const keys = Object.keys(data[0]);
    const csvContent = [
      includeHeaders ? keys.join(',') : null,
      ...data.map((row) => keys.map((key) => JSON.stringify(row[key] ?? '')).join(',')),
    ]
      .filter(Boolean)
      .join('\n');

    downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, `${filename}.json`, 'application/json');
  };

  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Choose your preferred export format and options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={(val) => setFormat(val as ExportFormat)}>
              {availableFormats.map((fmt) => {
                const Icon = formatIcons[fmt];
                return (
                  <div key={fmt} className="flex items-center space-x-2">
                    <RadioGroupItem value={fmt} id={fmt} />
                    <Label
                      htmlFor={fmt}
                      className="flex items-center gap-2 cursor-pointer font-normal"
                    >
                      <Icon className="h-4 w-4" />
                      {formatLabels[fmt]}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Options */}
          {(format === 'csv' || format === 'excel') && (
            <div className="space-y-3">
              <Label>Options</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="headers"
                  checked={includeHeaders}
                  onCheckedChange={(checked) => setIncludeHeaders(checked as boolean)}
                />
                <Label htmlFor="headers" className="cursor-pointer font-normal">
                  Include column headers
                </Label>
              </div>
            </div>
          )}

          {/* File Info */}
          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Records to export:</span>
              <span className="font-medium">{data.length}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-muted-foreground">Filename:</span>
              <span className="font-medium">{filename}.{format}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
