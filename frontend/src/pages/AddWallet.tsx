import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronDown, FaEye, FaEyeSlash } from 'react-icons/fa';

const WALLET_TEMPLATES = [
  { name: 'Default', bgColor: '#e2e8f0', textColor: '#1a1a1a' },
  { name: 'GCash', bgColor: '#0070f3', textColor: '#ffffff' },
  { name: 'Maya', bgColor: '#000000', textColor: '#00ff00' },
  { name: 'BDO', bgColor: '#003087', textColor: '#ffffff' },
  { name: 'BPI', bgColor: '#c8102e', textColor: '#ffffff' },
  { name: 'CIMB Bank PH', bgColor: '#ff0000', textColor: '#ffffff' },
] as const;

const WALLET_TYPES = ['Cash', 'E-Wallet', 'Bank', 'Savings Account', 'Insurance', 'Investment', 'Custom'] as const;
const WALLET_PLANS = ['Personal', 'Shared'] as const;

const CURRENCY_SYMBOLS: Record<string, string> = {
  PHP: '₱',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  CNY: '¥',
  INR: '₹',
};

export default function AddWallet() {
  const navigate = useNavigate();
  const [walletName, setWalletName] = useState('');
  const [walletBalance, setWalletBalance] = useState('');
  const [walletType, setWalletType] = useState('');
  const [walletPlan, setWalletPlan] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#87ceeb');
  const [textColor, setTextColor] = useState('#1a1a1a');
  const [selectedTemplate, setSelectedTemplate] = useState('Default');
  const [showBalance, setShowBalance] = useState(true);
  const [hasInteracted, setHasInteracted] = useState({ name: false, balance: false });
  
  const selectedCurrency = localStorage.getItem('selectedCurrency') || 'PHP';
  const currencySymbol = CURRENCY_SYMBOLS[selectedCurrency] || '₱';

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts[1] && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2);
    }
    setWalletBalance(value);
    setHasInteracted(prev => ({ ...prev, balance: true }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWalletName(e.target.value);
    setHasInteracted(prev => ({ ...prev, name: true }));
  };

  const formatAmount = (value: string): string => {
    if (!value) return '0.00';
    const parts = value.split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const decimalPart = parts[1] ? `.${parts[1]}` : '';
    return integerPart + decimalPart;
  };

  const handleTemplateSelect = (template: typeof WALLET_TEMPLATES[number]) => {
    setSelectedTemplate(template.name);
    setBackgroundColor(template.bgColor);
    setTextColor(template.textColor);
  };

  const handleSave = () => {
    // TODO: Implement wallet save functionality
  };

  return (
    <div className="wallet-page">
      <div className="wallet-container">
        <div className="wallet-header">
          <button className="wallet-back" type="button" onClick={() => navigate(-1)}>
            <FaChevronLeft />
          </button>
          <h1 className="wallet-title">Add Wallet</h1>
        </div>

        <div className="wallet-content">
          <div className="wallet-column">
            <div className="wallet-preview" style={{ backgroundColor, color: textColor }}>
              <div className="wallet-balance-header">
                <span>Balance</span>
                <button type="button" onClick={() => setShowBalance(!showBalance)}>
                  {showBalance ? <FaEye /> : <FaEyeSlash />}
                </button>
              </div>
              <div className="wallet-balance">{showBalance ? `${currencySymbol}${formatAmount(walletBalance || '0.00')}` : `${currencySymbol}••••`}</div>
              <div className="wallet-name">{walletName || 'Wallet'}</div>
              <div className="wallet-plan">{walletPlan || 'Plan Mode Budget'}</div>
              <div className="wallet-icon">💰</div>
            </div>

            <div className="wallet-form">
              <div className="wallet-field">
                <label>Wallet Name</label>
                <input
                  type="text"
                  placeholder={hasInteracted.name ? '' : 'Enter wallet name'}
                  value={walletName}
                  onChange={handleNameChange}
                  onFocus={() => setHasInteracted(prev => ({ ...prev, name: true }))}
                />
              </div>
              <div className="wallet-field">
                <label>Wallet Balance</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={hasInteracted.balance ? '' : '0.00'}
                  value={walletBalance}
                  onChange={handleBalanceChange}
                  onFocus={() => setHasInteracted(prev => ({ ...prev, balance: true }))}
                />
              </div>
              <div className="wallet-field">
                <label>Wallet Type</label>
                <div className="wallet-select">
                  <select value={walletType} onChange={(e) => setWalletType(e.target.value)}>
                    <option value="">Select wallet type</option>
                    {WALLET_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <FaChevronDown className="wallet-arrow" />
                </div>
              </div>
            </div>
          </div>

          <div className="wallet-column">
            <div className="wallet-form">
              <div className="wallet-field">
                <label>Templates</label>
              </div>
              <div className="wallet-templates">
                {WALLET_TEMPLATES.map((template) => (
                  <button
                    key={template.name}
                    className={`wallet-template ${selectedTemplate === template.name ? 'selected' : ''}`}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    style={{ backgroundColor: template.bgColor, color: template.textColor }}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
              <div className="wallet-field">
                <label>Wallet Plan</label>
                <div className="wallet-select">
                  <select value={walletPlan} onChange={(e) => setWalletPlan(e.target.value)}>
                    <option value="">Select wallet plan</option>
                    {WALLET_PLANS.map((plan) => (
                      <option key={plan} value={plan}>
                        {plan}
                      </option>
                    ))}
                  </select>
                  <FaChevronDown className="wallet-arrow" />
                </div>
              </div>
              <div className="wallet-colors">
                <div className="wallet-field">
                  <label>Background Color</label>
                  <div className="wallet-color">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                    />
                    <span>{backgroundColor}</span>
                  </div>
                </div>
                <div className="wallet-field">
                  <label>Text Color</label>
                  <div className="wallet-color">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                    />
                    <span>{textColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="wallet-footer">
          <button className="wallet-save" type="button" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
