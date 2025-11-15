import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronDown } from 'react-icons/fa';

export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<'welcome' | 'currency' | 'wallet'>('welcome');
  
  useEffect(() => {
    if (location.state?.step === 'wallet') {
      setStep('wallet');
    }
  }, [location.state]);
  const [currency, setCurrency] = useState(() => localStorage.getItem('selectedCurrency') || 'PHP');

  const handleGetStarted = () => {
    setStep('currency');
  };

  const handleCurrencyNext = () => {
    setStep('wallet');
  };

  const handleBack = () => {
    if (step === 'wallet') {
      setStep('currency');
    } else if (step === 'currency') {
      setStep('welcome');
    }
  };

  const handleWalletNext = () => {
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

  if (step === 'currency') {
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
                  onChange={(e) => {
                    const newCurrency = e.target.value;
                    setCurrency(newCurrency);
                    localStorage.setItem('selectedCurrency', newCurrency);
                  }}
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
            <div className="onboarding-navigation-wrapper">
              <button className="onboarding-button-back" type="button" onClick={handleBack}>
                Back
              </button>
              <button className="onboarding-button-next" type="button" onClick={handleCurrencyNext}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'wallet') {
    return (
      <div className="onboarding-page">
        <div className="onboarding-card">
          <div className="onboarding-form-inner">
            <div className="onboarding-header">
              <h1 className="onboarding-title-wallet">Add Wallet</h1>
              <p className="onboarding-subtitle-normal">Just add your wallets, and we'll help you keep a clear view of your balances. It's easy as that!</p>
            </div>
            <div className="onboarding-wallet-card-wrapper">
              <button
                className="onboarding-wallet-card"
                type="button"
                onClick={() => navigate('/add-wallet')}
              >
                <span className="onboarding-wallet-plus">+</span>
              </button>
            </div>
            <div className="onboarding-navigation-wrapper">
              <button className="onboarding-button-back" type="button" onClick={handleBack}>
                Back
              </button>
              <button className="onboarding-button-next" type="button" onClick={handleWalletNext}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
