import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, ArrowLeft, Send, Check, ChevronsUpDown } from 'lucide-react';
import { useRecordingDetails } from '@/api/hooks/useCatalog';
import { useEntities } from '@/api/hooks/useEntities';
import apiClient from '@/api/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Template {
  id: number;
  name: string;
  description: string;
}

interface ShareTypeConfig {
  produse_fizice_artist: number;
  emd_artist: number;
  other_artist: number;
}

export default function CoProdContractGeneration() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const recordingId = parseInt(id || '0', 10);

  const { data: recordingDetails, isLoading: loadingRecording } = useRecordingDetails(recordingId);
  const { data: entitiesData } = useEntities({ roles: 'label', page_size: 100 });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Label selection
  const [labelOpen, setLabelOpen] = useState(false);
  const [selectedLabelId, setSelectedLabelId] = useState<number | null>(null);

  // Share Type Configuration (Artist-specific shares)
  const [shareTypes, setShareTypes] = useState<ShareTypeConfig>({
    produse_fizice_artist: 50,
    emd_artist: 50,
    other_artist: 50,
  });

  // Contract terms
  const [contractTerms, setContractTerms] = useState({
    title: '',
    start_date: new Date().toISOString().split('T')[0],
    duration_years: '3',
    currency: 'EUR',
    notes: ''
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (recordingDetails?.recording) {
      setContractTerms(prev => ({
        ...prev,
        title: `Co-Production Agreement - ${recordingDetails.recording.title}`
      }));
    }
  }, [recordingDetails]);

  const loadTemplates = async () => {
    try {
      const response = await apiClient.get('/api/v1/templates/');
      setTemplates(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load contract templates');
    }
  };

  const selectedLabel = entitiesData?.results?.find(e => e.id === selectedLabelId);

  const generateContract = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a contract template');
      return;
    }

    if (!selectedLabelId) {
      toast.error('Please select a label');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/api/v1/contracts/', {
        template_id: parseInt(selectedTemplate),
        title: contractTerms.title,
        recording_id: recordingId,
        counterparty_entity_id: selectedLabelId,
        contract_terms: {
          start_date: contractTerms.start_date,
          duration_years: parseInt(contractTerms.duration_years),
          currency: contractTerms.currency,
          notes: contractTerms.notes,
          share_types: shareTypes
        }
      });

      toast.success('Co-production contract generation started!');
      navigate(`/contracts`);
    } catch (error: any) {
      console.error('Failed to generate contract:', error);
      toast.error(error.response?.data?.detail || 'Failed to generate contract');
    } finally {
      setLoading(false);
    }
  };

  if (loadingRecording) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!recordingDetails) {
    return (
      <AppLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Recording not found</p>
        </div>
      </AppLayout>
    );
  }

  const recording = recordingDetails.recording;

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/catalog/recordings/${recordingId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Recording
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Generate Co-Production Contract</h1>
            <p className="text-muted-foreground mt-1">
              Creating co-production contract for: <strong>{recording.title}</strong>
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column - Contract Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contract Details</CardTitle>
                <CardDescription>
                  Configure the basic contract terms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="template">Contract Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Co-Production Label</Label>
                  <Popover open={labelOpen} onOpenChange={setLabelOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={labelOpen}
                        className="w-full justify-between"
                      >
                        {selectedLabel ? selectedLabel.display_name : "Select label..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search labels..." />
                        <CommandList>
                          <CommandEmpty>No labels found.</CommandEmpty>
                          <CommandGroup>
                            {entitiesData?.results?.map((entity) => (
                              <CommandItem
                                key={entity.id}
                                value={entity.display_name}
                                onSelect={() => {
                                  setSelectedLabelId(entity.id);
                                  setLabelOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedLabelId === entity.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {entity.display_name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="title">Contract Title</Label>
                  <Input
                    id="title"
                    value={contractTerms.title}
                    onChange={(e) => setContractTerms({ ...contractTerms, title: e.target.value })}
                    placeholder="e.g., Co-Production Agreement - Song Title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={contractTerms.start_date}
                      onChange={(e) => setContractTerms({ ...contractTerms, start_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="duration">Duration (years)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={contractTerms.duration_years}
                      onChange={(e) => setContractTerms({ ...contractTerms, duration_years: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={contractTerms.currency}
                    onValueChange={(value) => setContractTerms({ ...contractTerms, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="RON">RON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={contractTerms.notes}
                    onChange={(e) => setContractTerms({ ...contractTerms, notes: e.target.value })}
                    placeholder="Any additional notes or terms..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Share Types */}
          <div>
            {/* Share Types Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Artist Share Types</CardTitle>
                <CardDescription>
                  Configure specific share percentages for different revenue streams
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="produse_fizice">Physical Products (Produse Fizice) - Artist Share (%)</Label>
                  <Input
                    id="produse_fizice"
                    type="number"
                    value={shareTypes.produse_fizice_artist}
                    onChange={(e) => setShareTypes({ ...shareTypes, produse_fizice_artist: parseFloat(e.target.value) || 0 })}
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Artist's share from physical product sales (CDs, vinyl, etc.)
                  </p>
                </div>

                <div>
                  <Label htmlFor="emd">EMD (Digital Mechanical) - Artist Share (%)</Label>
                  <Input
                    id="emd"
                    type="number"
                    value={shareTypes.emd_artist}
                    onChange={(e) => setShareTypes({ ...shareTypes, emd_artist: parseFloat(e.target.value) || 0 })}
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Artist's share from digital mechanical exploitation (streaming, downloads)
                  </p>
                </div>

                <div>
                  <Label htmlFor="other">Other Revenue - Artist Share (%)</Label>
                  <Input
                    id="other"
                    type="number"
                    value={shareTypes.other_artist}
                    onChange={(e) => setShareTypes({ ...shareTypes, other_artist: parseFloat(e.target.value) || 0 })}
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Artist's share from other revenue sources (sync, licensing, etc.)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={generateContract}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Generate Contract
              </>
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
