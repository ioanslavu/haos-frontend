import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { ArtistSelection } from './ArtistSelection'
import { DeliverableSelection } from './DeliverableSelection'
import { UsageTermsSelection } from './UsageTermsSelection'
import { PricingStep } from './PricingStep'
import { ReviewStep } from './ReviewStep'

export interface ProposalBuilderData {
  opportunityId: number | undefined
  artists: Array<{
    artistId: number
    role: 'main' | 'featured' | 'guest' | 'ensemble'
    proposedFee?: string
  }>
  deliverables: Array<{
    type: string
    quantity: number
    description: string
  }>
  usageTermsId?: number
  feeGross: string
  discounts: string
  agencyFee: string
  currency: string
  notes: string
}

const STEPS = [
  { id: 1, title: 'Opportunity & Artists', description: 'Select opportunity, artists and their roles' },
  { id: 2, title: 'Deliverables', description: 'Choose deliverable packs or custom items' },
  { id: 3, title: 'Usage Terms', description: 'Define image rights and licensing' },
  { id: 4, title: 'Pricing', description: 'Set fees and calculate totals' },
  { id: 5, title: 'Review', description: 'Review and submit proposal' },
]

interface ProposalBuilderProps {
  opportunityId: number
  onSubmit: (data: ProposalBuilderData) => Promise<void>
  onCancel: () => void
}

export function ProposalBuilder({ opportunityId, onSubmit, onCancel }: ProposalBuilderProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<ProposalBuilderData>({
    opportunityId: opportunityId > 0 ? opportunityId : undefined,
    artists: [],
    deliverables: [],
    currency: 'EUR',
    feeGross: '0',
    discounts: '0',
    agencyFee: '0',
    notes: '',
  })

  const progressPercent = (currentStep / STEPS.length) * 100

  const updateData = (updates: Partial<ProposalBuilderData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!data.opportunityId && data.artists.length > 0
      case 2:
        return data.deliverables.length > 0
      case 3:
        return true // Usage terms are optional
      case 4:
        return parseFloat(data.feeGross) > 0
      case 5:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    await onSubmit(data)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <ArtistSelection data={data} updateData={updateData} />
      case 2:
        return <DeliverableSelection data={data} updateData={updateData} />
      case 3:
        return <UsageTermsSelection data={data} updateData={updateData} />
      case 4:
        return <PricingStep data={data} updateData={updateData} />
      case 5:
        return <ReviewStep data={data} updateData={updateData} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Create Proposal</h2>
          <span className="text-sm text-muted-foreground">
            Step {currentStep} of {STEPS.length}
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  currentStep > step.id
                    ? 'bg-primary border-primary text-primary-foreground'
                    : currentStep === step.id
                    ? 'border-primary text-primary'
                    : 'border-muted text-muted-foreground'
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="font-semibold">{step.id}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground hidden sm:block">{step.description}</p>
              </div>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-full mx-4 transition-colors ${
                  currentStep > step.id ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[400px]">{renderStep()}</CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={currentStep === 1 ? onCancel : handleBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>

          {currentStep < STEPS.length ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed()}>
              <Check className="mr-2 h-4 w-4" />
              Submit Proposal
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
