import React from 'react';
import './CheckoutStepper.css';

type Step = {
  label: string;
  index: number;
};

interface CheckoutStepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const steps: Step[] = [
  { label: 'Information', index: 0 },
  { label: 'Shipping', index: 1 },
  { label: 'Payment', index: 2 },
];

export const CheckoutStepper: React.FC<CheckoutStepperProps> = ({ currentStep, onStepClick }) => {
  return (
    <nav className="checkout-stepper" aria-label="checkout steps">
      <ul>
        {steps.map((step) => (
          <li
            key={step.index}
            className={step.index === currentStep ? 'active' : 'inactive'}
            onClick={() => onStepClick && onStepClick(step.index)}
            role={onStepClick ? 'button' : undefined}
            aria-current={step.index === currentStep ? 'step' : undefined}
          >
            <span className="step-number">{step.index + 1}</span>
            <span className="step-label">{step.label}</span>
          </li>
        ))}
      </ul>
    </nav>
  );
};
