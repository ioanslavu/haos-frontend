/**
 * PRODUCT TOUR COMPONENT
 *
 * Interactive walkthrough for new users using react-joyride.
 *
 * USAGE:
 * Add to main app layout (already done in AppLayout):
 * ```tsx
 * <ProductTour />
 * ```
 *
 * CUSTOMIZATION:
 * - Edit tour steps: src/config/onboarding-tours.ts
 * - Edit styles: tourOptions in onboarding-tours.ts
 * - Edit behavior: useOnboardingTour hook
 *
 * DATA ATTRIBUTES:
 * Components that should be highlighted in the tour need data-tour attributes:
 * ```tsx
 * <Button data-tour="create-contract">Create Contract</Button>
 * ```
 *
 * MANUAL CONTROLS:
 * Users can restart the tour from the help menu:
 * ```tsx
 * const { startTour } = useOnboardingTour();
 * <MenuItem onClick={startTour}>Restart Tour</MenuItem>
 * ```
 */

import React from 'react';
import Joyride, { TooltipRenderProps } from 'react-joyride';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import { tourOptions } from '@/config/onboarding-tours';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Custom tooltip component for the tour
 * Matches the app's design system
 */
const CustomTooltip: React.FC<TooltipRenderProps> = ({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
  size,
}) => {
  return (
    <div
      {...tooltipProps}
      className="bg-popover border border-border rounded-lg shadow-lg p-4 max-w-sm"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {step.title && (
            <h3 className="font-semibold text-base mb-1">{step.title}</h3>
          )}
          <div className="text-sm text-muted-foreground">{step.content}</div>
        </div>
        <button
          {...closeProps}
          className="ml-2 p-1 hover:bg-muted rounded-md transition-colors"
          aria-label="Close tour"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        {/* Progress indicator */}
        <div className="text-xs text-muted-foreground">
          {index + 1} of {size}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          {index > 0 && (
            <Button
              {...backProps}
              variant="outline"
              size="sm"
              className="h-8"
            >
              <ChevronLeft className="h-3 w-3 mr-1" />
              Back
            </Button>
          )}

          {continuous && (
            <Button
              {...primaryProps}
              size="sm"
              className="h-8"
            >
              {isLastStep ? (
                'Finish'
              ) : (
                <>
                  Next
                  <ChevronRight className="h-3 w-3 ml-1" />
                </>
              )}
            </Button>
          )}

          {!isLastStep && (
            <Button
              {...skipProps}
              variant="ghost"
              size="sm"
              className="h-8"
            >
              Skip Tour
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Main ProductTour component
 */
export const ProductTour: React.FC = () => {
  const { run, steps, handleJoyrideCallback } = useOnboardingTour();

  if (steps.length === 0) {
    return null;
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      tooltipComponent={CustomTooltip}
      styles={tourOptions.styles}
      locale={tourOptions.locale}
      floaterProps={tourOptions.floaterProps}
      spotlightClicks={tourOptions.spotlightClicks}
      disableOverlayClose={tourOptions.disableOverlayClose}
    />
  );
};
