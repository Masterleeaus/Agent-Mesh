import { useState, type ReactNode } from 'react';
import { Button, Card, ProgressIndicator } from '../../../shared/src/components';
import type { BookingWizardStepVM } from '../models/view-models';

interface BookingWizardProps {
  steps: BookingWizardStepVM[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  submitting?: boolean;
  children: ReactNode;
}

export function BookingWizard({ steps, currentStep, onStepChange, onComplete, submitting, children }: BookingWizardProps) {
  const totalSteps = steps.length;
  const progress = ((currentStep) / (totalSteps)) * 100;

  return (
    <Card padding="lg" variant="elevated">
      <div style={{ marginBottom: 24 }}>
        <ProgressIndicator value={progress} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          {steps.map((s, i) => (
            <div
              key={s.step}
              onClick={() => i < currentStep ? onStepChange(s.step) : undefined}
              style={{
                fontSize: 12, fontWeight: i === currentStep ? 700 : 400,
                color: i === currentStep ? '#41d1c4' : i < currentStep ? '#94a3b8' : '#475569',
                cursor: i < currentStep ? 'pointer' : 'default',
                textAlign: 'center', flex: 1,
              }}
            >
              {s.title}
            </div>
          ))}
        </div>
      </div>
      <div>{children}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <Button
          variant="secondary"
          onClick={() => onStepChange(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          Back
        </Button>
        {currentStep < totalSteps - 1 ? (
          <Button onClick={() => onStepChange(currentStep + 1)}>Next</Button>
        ) : (
          <Button onClick={onComplete} loading={submitting}>Complete Booking</Button>
        )}
      </div>
    </Card>
  );
}
