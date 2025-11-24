import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronDown } from 'react-icons/fa';
import * as settingsService from '../../services/settingsService';

export default function Currency() {
  const navigate = useNavigate();
  const [currency, setCurrency] = useState('PHP');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const settings = await settingsService.getSettings();
        setCurrency(settings.currency || 'PHP');
      } catch (err) {
        console.error('Failed to load currency:', err);
        // Fallback to PHP if load fails
        setCurrency('PHP');
      } finally {
        setLoading(false);
      }
    };
    loadCurrency();
  }, []);

  const handleBack = () => {
    navigate('/onboarding/welcome');
  };

  const handleNext = async () => {
    try {
      // Save currency to database
      await settingsService.updateSettings({ currency });
      navigate('/onboarding/wallet');
    } catch (err) {
      console.error('Failed to save currency:', err);
      // Still navigate even if save fails
      navigate('/onboarding/wallet');
    }
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
                }}
                className="onboarding-currency-dropdown"
                disabled={loading}
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
