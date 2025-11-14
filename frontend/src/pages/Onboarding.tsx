import { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';

export default function Onboarding() {
  const [step, setStep] = useState<'welcome' | 'currency'>('welcome');
  const [currency, setCurrency] = useState('PHP');

  const handleGetStarted = () => {
    setStep('currency');
  };

  const handleNext = () => {
    console.log('Selected currency:', currency);
  };

  if (step === 'welcome') {
    return (
      <div className="onboarding-page">
        <div className="onboarding-card">
          <div className="onboarding-form-inner">
            <div className="onboarding-header">
              <h1 className="onboarding-title">WELCOME TO CASH</h1>
              <p className="onboarding-subtitle">A Cloud Access Synchronized Hub Expense Tracker</p>
            </div>
            <div className="onboarding-button-wrapper">
              <button className="onboarding-button-primary" type="button" onClick={handleGetStarted}>
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-form-inner">
          <div className="onboarding-header">
            <h1 className="onboarding-title-normal">Choose Currency</h1>
            <p className="onboarding-subtitle-normal">Let's begin by selecting your preferred currency.</p>
          </div>
          <div className="onboarding-currency-wrapper">
            <div className="onboarding-currency-select">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="onboarding-currency-dropdown"
              >
                <option value="PHP">PHP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
                <option value="AUD">AUD</option>
                <option value="CAD">CAD</option>
                <option value="CHF">CHF</option>
                <option value="CNY">CNY</option>
                <option value="INR">INR</option>
              </select>
              <FaChevronDown className="onboarding-currency-arrow" />
            </div>
          </div>
          <div className="onboarding-next-wrapper">
            <button className="onboarding-button-next" type="button" onClick={handleNext}>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
