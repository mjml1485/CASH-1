import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronDown, FaEye, FaEyeSlash, FaUsers } from 'react-icons/fa';
import type { Collaborator } from '../utils/shared';
import { CURRENCY_SYMBOLS, formatAmount, triggerSelectDropdown } from '../utils/shared';
import CollaboratorModal from './CollaboratorModal';

// CONSTANTS

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

// TYPES

interface HasInteracted {
  name: boolean;
  balance: boolean;
  walletType: boolean;
}

// COMPONENT

export default function AddWallet() {
  const navigate = useNavigate();
  const location = useLocation();
  const editMode = location.state?.editMode || false;
  const walletIndex = location.state?.walletIndex;
  const existingWallet = location.state?.walletData;
  const returnTo = location.state?.returnTo || '/onboarding/wallet';
  const presetWalletPlan = location.state?.walletPlan;
  
  const [walletName, setWalletName] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<string>('');
  const [walletType, setWalletType] = useState<string>('');
  const [customWalletType, setCustomWalletType] = useState<string>('');
  const [walletPlan, setWalletPlan] = useState<string>(presetWalletPlan || '');
  const [backgroundColor, setBackgroundColor] = useState<string>('#e2e8f0');
  const [textColor, setTextColor] = useState<string>('#1a1a1a');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('Default');
  const [showBalance, setShowBalance] = useState<boolean>(true);
  const [hasInteracted, setHasInteracted] = useState<HasInteracted>({ name: false, balance: false, walletType: false });
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [showPlanChangeModal, setShowPlanChangeModal] = useState<boolean>(false);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const selectedCurrency = localStorage.getItem('selectedCurrency') || 'PHP';
  const currencySymbol = CURRENCY_SYMBOLS[selectedCurrency] || '₱';

  useEffect(() => {
    if (editMode && existingWallet) {
      setWalletName(existingWallet.name || '');
      setWalletBalance(existingWallet.balance || '');
      setWalletPlan(existingWallet.plan || '');
      
      const predefinedTypes = ['Cash', 'E-Wallet', 'Bank', 'Savings Account', 'Insurance', 'Investment'];
      if (predefinedTypes.includes(existingWallet.walletType)) {
        setWalletType(existingWallet.walletType);
        setCustomWalletType('');
      } else {
        setWalletType('Custom');
        setCustomWalletType(existingWallet.walletType || '');
      }
      
      if (existingWallet.backgroundColor) {
        setBackgroundColor(existingWallet.backgroundColor);
      }
      if (existingWallet.textColor) {
        setTextColor(existingWallet.textColor);
      }
      if (existingWallet.template) {
        setSelectedTemplate(existingWallet.template);
      }
      
      if (existingWallet.collaborators && existingWallet.collaborators.length > 0) {
        setCollaborators(existingWallet.collaborators);
      }
      
      setHasInteracted({ name: true, balance: true, walletType: true });
    }
  }, [editMode, existingWallet]);

  useEffect(() => {
    if (walletPlan === 'Shared' && !editMode) {
      setShowShareModal(true);
    } else if (walletPlan === 'Personal') {
      setShowShareModal(false);
      if (!editMode) {
        setCollaborators([]);
      }
    }
  }, [walletPlan, editMode]);

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

  const handleTemplateSelect = (template: typeof WALLET_TEMPLATES[number]) => {
    setSelectedTemplate(template.name);
    setBackgroundColor(template.bgColor);
    setTextColor(template.textColor);
  };

  const validateWallet = () => {
    const missing: string[] = [];
    const nextErrors: Record<string, string> = {};
    if (!walletName.trim()) { missing.push('Wallet Name'); nextErrors.name = 'Wallet name is required.'; }
    if (!walletBalance.trim()) { missing.push('Wallet Balance'); nextErrors.balance = 'Wallet balance is required.'; }
    if (!walletType && !customWalletType.trim()) { missing.push('Wallet Type'); nextErrors.walletType = 'Please select a wallet type.'; }
    if (!walletPlan) { missing.push('Wallet Plan'); nextErrors.walletPlan = 'Please select a wallet plan.'; }
    setErrors(nextErrors);
    return missing;
  };

  const handleSave = () => {
    const missing = validateWallet();
    if (missing.length > 0) return;
    const walletDataToPass = {
      id: editMode && existingWallet?.id ? existingWallet.id : Date.now().toString(),
      name: walletName,
      balance: walletBalance,
      plan: walletPlan,
      type: customWalletType || walletType,
      walletType: customWalletType || walletType,
      collaborators: walletPlan === 'Shared' ? collaborators : [],
      backgroundColor: backgroundColor,
      textColor: textColor,
      color1: backgroundColor,
      color2: backgroundColor,
      template: selectedTemplate
    };

    if (returnTo === '/onboarding/wallet') {
      navigate(returnTo, {
        state: {
          walletData: walletDataToPass,
          walletIndex: editMode ? walletIndex : undefined
        }
      });
      return;
    }

    const existingWallets = sessionStorage.getItem('wallets');
    let wallets = existingWallets ? JSON.parse(existingWallets) : [];

    if (editMode && walletIndex !== undefined) {
      wallets[walletIndex] = walletDataToPass;
    } else {
      wallets.push(walletDataToPass);
    }

    sessionStorage.setItem('wallets', JSON.stringify(wallets));

    try {
      const rawBudgets = sessionStorage.getItem('budgets');
      if (rawBudgets) {
        const budgets = JSON.parse(rawBudgets);
        const targetNames = new Set<string>([
          walletName,
          ...(editMode && existingWallet?.name && existingWallet.name !== walletName ? [existingWallet.name] : [])
        ]);
        const updatedBudgets = budgets.map((b: any) => {
          if (b.plan === 'Shared' && targetNames.has(b.wallet)) {
            return { ...b, collaborators };
          }
          return b;
        });
        sessionStorage.setItem('budgets', JSON.stringify(updatedBudgets));
      }
    } catch {}

    try {
      window.dispatchEvent(new CustomEvent('data-updated', { detail: { source: 'wallet-save' } }));
    } catch {}

    navigate(returnTo);
  };

  const handleAddCollaborator = (input: string) => {
    const newCollaborator = {
      id: Date.now().toString(),
      name: input.includes('@') ? input.split('@')[0] : input,
      email: input.includes('@') ? input : `${input}@example.com`,
      role: 'Editor'
    };
    setCollaborators([...collaborators, newCollaborator]);
  };

  const handleRemoveCollaborator = (id: string) => {
    setCollaborators(collaborators.filter(c => c.id !== id));
  };

  const handleRoleChange = (id: string, newRole: string) => {
    setCollaborators(collaborators.map(c => 
      c.id === id ? { ...c, role: newRole } : c
    ));
  };

  const handlePlanChange = (newPlan: string) => {
    if (walletPlan === 'Shared' && newPlan === 'Personal') {
      const hasCollabs = collaborators.length > 0;
      let hasLinkedBudgets = false;
      if (returnTo === '/dashboard' && editMode && existingWallet?.name) {
        const raw = sessionStorage.getItem('budgets');
        const budgets = raw ? JSON.parse(raw) : [];
        hasLinkedBudgets = budgets.some((b: any) => b.wallet === existingWallet.name && b.plan === 'Shared');
      }
      if (hasCollabs || hasLinkedBudgets) {
        setPendingPlan('Personal');
        setShowPlanChangeModal(true);
        return;
      }
    }
    if (walletPlan === 'Personal' && newPlan === 'Shared') {
      setPendingPlan('Shared');
      setShowPlanChangeModal(true);
      return;
    }
    setWalletPlan(newPlan);
    if (newPlan === 'Personal') {
      setCollaborators([]);
    }
  };

  const confirmPlanChange = () => {
    setShowPlanChangeModal(false);
    if (pendingPlan === 'Personal') {
      setWalletPlan('Personal');
      setCollaborators([]);
      if (returnTo === '/dashboard' && editMode && existingWallet?.name) {
        const raw = sessionStorage.getItem('budgets');
        const budgets = raw ? JSON.parse(raw) : [];
        const updated = budgets.map((b: any) => {
          if (b.wallet === existingWallet.name) {
            return { ...b, plan: 'Personal', wallet: 'Personal Wallets', collaborators: [] };
          }
          return b;
        });
        sessionStorage.setItem('budgets', JSON.stringify(updated));
      }
    } else if (pendingPlan === 'Shared') {
      setWalletPlan('Shared');
      setShowShareModal(true);
    }
    setPendingPlan(null);
  };

  const cancelPlanChange = () => {
    setShowPlanChangeModal(false);
    setPendingPlan(null);
  };

  const handleWalletTypeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'Custom') {
      setWalletType('Custom');
      setCustomWalletType('');
      setHasInteracted(prev => ({ ...prev, walletType: true }));
    } else {
      setWalletType(value);
      setCustomWalletType('');
    }
  };

  const handleCustomWalletTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomWalletType(e.target.value);
  };

  const handleCustomWalletTypeBlur = () => {
    if (!customWalletType.trim()) {
      setHasInteracted(prev => ({ ...prev, walletType: false }));
    }
  };

  const handleDropdownClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (walletType === 'Custom') {
      setWalletType('');
      setCustomWalletType('');
      setHasInteracted(prev => ({ ...prev, walletType: false }));
      
      setTimeout(() => {
        const wrapper = (e.currentTarget as HTMLElement).closest('.wallet-select');
        if (!wrapper) return;
        const select = wrapper.querySelector('select');
        if (select) triggerSelectDropdown(select as HTMLSelectElement);
      }, 50);
      return;
    }
    
    const wrapper = (e.currentTarget as HTMLElement).closest('.wallet-select');
    if (!wrapper) return;
    const select = wrapper.querySelector('select');
    if (select) triggerSelectDropdown(select as HTMLSelectElement);
  };

  return (
    <div className="wallet-page">
      <div className="wallet-container">
        <div className="wallet-header">
          <button className="wallet-back" type="button" onClick={() => navigate(returnTo)}>
            <FaChevronLeft />
          </button>
          <h1 className="wallet-title">{editMode ? 'Edit Wallet' : 'Add Wallet'}</h1>
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
                  placeholder={walletName || !hasInteracted.name ? 'Enter wallet name' : ''}
                  value={walletName}
                  onChange={(e) => { setErrors(prev => ({...prev, name: ''})); handleNameChange(e); }}
                  onFocus={() => setHasInteracted(prev => ({ ...prev, name: true }))}
                  onBlur={() => {
                    if (!walletName.trim()) {
                      setHasInteracted(prev => ({ ...prev, name: false }));
                    }
                  }}
                  className={errors.name ? 'input-error' : ''}
                />
                {errors.name && <div className="error-text">{errors.name}</div>}
              </div>
              <div className="wallet-field">
                <label>Wallet Balance</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={walletBalance || !hasInteracted.balance ? '0.00' : ''}
                  value={walletBalance}
                  onChange={(e) => { setErrors(prev => ({...prev, balance: ''})); handleBalanceChange(e); }}
                  onFocus={() => setHasInteracted(prev => ({ ...prev, balance: true }))}
                  onBlur={() => {
                    if (!walletBalance.trim()) {
                      setHasInteracted(prev => ({ ...prev, balance: false }));
                    }
                  }}
                  className={errors.balance ? 'input-error' : ''}
                />
                {errors.balance && <div className="error-text">{errors.balance}</div>}
              </div>
              <div className="wallet-field">
                <label>Wallet Type</label>
                <div className="wallet-select">
                  {walletType === 'Custom' ? (
                    <>
                      <input
                        type="text"
                        className={`wallet-select-input ${errors.walletType ? 'input-error' : ''}`}
                        placeholder={!customWalletType.trim() ? 'Custom' : ''}
                        value={customWalletType}
                        onChange={handleCustomWalletTypeChange}
                        onFocus={() => setHasInteracted(prev => ({ ...prev, walletType: true }))}
                        onBlur={handleCustomWalletTypeBlur}
                      />
                      <select
                        value={walletType}
                        onChange={handleWalletTypeSelect}
                        className="wallet-select-hidden"
                      >
                        {WALLET_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <div 
                        className={`wallet-select-display ${errors.walletType ? 'input-error' : ''}`}
                        onClick={(e) => e.preventDefault()}
                      >
                        <span className={walletType ? '' : 'placeholder-text'}>
                          {walletType || 'Select type'}
                        </span>
                      </div>
                      <select 
                        value={walletType} 
                        onChange={(e) => { setErrors(prev => ({...prev, walletType: ''})); handleWalletTypeSelect(e); }}
                        className="wallet-select-hidden"
                      >
                        <option value="" disabled hidden>Select type</option>
                        {WALLET_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                  <button
                    type="button"
                    className="wallet-arrow-button"
                    onClick={handleDropdownClick}
                    aria-label="Change wallet type"
                  >
                    <FaChevronDown className="wallet-arrow" />
                  </button>
                </div>
                {errors.walletType && <div className="error-text">{errors.walletType}</div>}
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
                <div className="wallet-field-label-row">
                  <label>Wallet Plan</label>
                  {walletPlan === 'Shared' && (
                    <button
                      type="button"
                      className="wallet-share-icon"
                      onClick={() => setShowShareModal(true)}
                      title="Manage collaborators"
                    >
                      <FaUsers />
                    </button>
                  )}
                </div>
                <div className="wallet-select">
                  <div 
                    className={`wallet-select-display ${errors.walletPlan ? 'input-error' : ''}`}
                    onClick={(e) => {
                      const parent = e.currentTarget.parentElement;
                      if (!parent) return;
                      const select = parent.querySelector('select');
                      if (select) triggerSelectDropdown(select);
                    }}
                  >
                    <span>
                      {walletPlan || 'Select plan'}
                    </span>
                    <button
                      type="button"
                      className="wallet-arrow-button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const parent = e.currentTarget.closest('.wallet-select');
                        if (!parent) return;
                        const select = parent.querySelector('select');
                        if (select) triggerSelectDropdown(select);
                      }}
                      aria-label="Change wallet plan"
                    >
                      <FaChevronDown className="wallet-arrow" />
                    </button>
                  </div>
                  <select 
                    value={walletPlan} 
                    onChange={(e) => { setErrors(prev => ({...prev, walletPlan: ''})); handlePlanChange(e.target.value); }}
                    className="wallet-select-hidden"
                  >
                    <option value="" disabled hidden>Select plan</option>
                    {WALLET_PLANS.map((plan) => (
                      <option key={plan} value={plan}>
                        {plan}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.walletPlan && <div className="error-text">{errors.walletPlan}</div>}
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

      <CollaboratorModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={walletName || 'Wallet Name'}
        collaborators={collaborators}
        onAddCollaborator={handleAddCollaborator}
        onRemoveCollaborator={handleRemoveCollaborator}
        onRoleChange={handleRoleChange}
        variant="wallet"
      />

      {showPlanChangeModal && (
        <div className="wallet-modal-overlay" role="dialog" aria-modal="true">
          <div className="wallet-modal">
            <h3 className="wallet-modal-title">{pendingPlan === 'Shared' ? 'Convert to Shared?' : 'Convert to Personal?'}</h3>
            <p className="wallet-confirm-text">
              {pendingPlan === 'Shared'
                ? 'Switching this wallet to Shared lets you add collaborators. Personal budgets are unaffected; new budgets under this wallet can be shared.'
                : 'Switching this wallet to Personal will remove collaborators and convert its shared budgets to personal budgets linked to all personal wallets. This action cannot be undone.'}
            </p>
            <div className="wallet-confirm-actions">
              <button type="button" className="wallet-modal-btn" onClick={confirmPlanChange}>Confirm</button>
              <button type="button" className="wallet-modal-btn secondary" onClick={cancelPlanChange}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
