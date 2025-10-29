import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileText, ArrowLeft, Send } from 'lucide-react';
import { useWorkDetails } from '@/api/hooks/useCatalog';
import apiClient from '@/api/client';
import { toast } from 'sonner';

interface Template {
  id: number;
  name: string;
  description: string;
}

export default function WorkContractGeneration() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const workId = parseInt(id || '0', 10);

  const { data: workDetails, isLoading: loadingWork } = useWorkDetails(workId);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(false);

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
    if (workDetails?.work) {
      setContractTerms(prev => ({
        ...prev,
        title: `Publishing Agreement - ${workDetails.work.title}`
      }));
    }
  }, [workDetails]);

  const loadTemplates = async () => {
    try {
      const response = await apiClient.get('/api/v1/templates/');
      setTemplates(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load contract templates');
    }
  };

  const generateContract = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a contract template');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/api/v1/contracts/', {
        template_id: parseInt(selectedTemplate),
        title: contractTerms.title,
        work_id: workId,
        contract_terms: {
          start_date: contractTerms.start_date,
          duration_years: parseInt(contractTerms.duration_years),
          currency: contractTerms.currency,
          notes: contractTerms.notes
        }
      });

      toast.success('Contract generation started!');
      navigate(`/contracts`);
    } catch (error: any) {
      console.error('Failed to generate contract:', error);
      toast.error(error.response?.data?.detail || 'Failed to generate contract');
    } finally {
      setLoading(false);
    }
  };

  if (loadingWork) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!workDetails) {
    return (
      <AppLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Work not found</p>
        </div>
      </AppLayout>
    );
  }

  const work = workDetails.work;

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/catalog/works/${workId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Work
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Generate Work Contract</h1>
            <p className="text-muted-foreground mt-1">
              Creating contract for: <strong>{work.title}</strong>
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contract Details</CardTitle>
            <CardDescription>
              Configure the basic contract terms for this musical work
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
              <Label htmlFor="title">Contract Title</Label>
              <Input
                id="title"
                value={contractTerms.title}
                onChange={(e) => setContractTerms({ ...contractTerms, title: e.target.value })}
                placeholder="e.g., Publishing Agreement - Song Title"
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
