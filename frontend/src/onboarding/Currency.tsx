import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronDown } from 'react-icons/fa';

export default function Currency() {
  const navigate = useNavigate();
  const [currency, setCurrency] = useState(() => localStorage.getItem('selectedCurrency') || 'PHP');

  const handleBack = () => {
    navigate('/onboarding/welcome');
  };

  const handleNext = () => {
    navigate('/onboarding/wallet');
  };

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
            <button className="onboarding-button-next" type="button" onClick={handleNext}>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
