import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronDown, FaEye, FaEyeSlash, FaUsers } from 'react-icons/fa';
import type { Collaborator } from '../utils/shared';
import { CURRENCY_SYMBOLS, formatAmount, triggerSelectDropdown } from '../utils/shared';

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
  const [walletName, setWalletName] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<string>('');
  const [walletType, setWalletType] = useState<string>('');
  const [customWalletType, setCustomWalletType] = useState<string>('');
  const [walletPlan, setWalletPlan] = useState<string>('');
  const [backgroundColor, setBackgroundColor] = useState<string>('#e2e8f0');
  const [textColor, setTextColor] = useState<string>('#1a1a1a');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('Default');
  const [showBalance, setShowBalance] = useState<boolean>(true);
  const [hasInteracted, setHasInteracted] = useState<HasInteracted>({ name: false, balance: false, walletType: false });
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [collaboratorInput, setCollaboratorInput] = useState<string>('');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  
  const selectedCurrency = localStorage.getItem('selectedCurrency') || 'PHP';
  const currencySymbol = CURRENCY_SYMBOLS[selectedCurrency] || '₱';

  // Placeholder owner data
  const owner = {
    id: '1',
    name: 'FirstName LastName',
    email: 'useroneeeeeeeee@gmail.com',
    role: 'Owner'
  };

  useEffect(() => {
    if (walletPlan === 'Shared') {
      setShowShareModal(true);
    } else {
      setShowShareModal(false);
      setCollaborators([]);
    }
  }, [walletPlan]);

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

  const handleSave = () => {
    const walletDataToPass = {
      name: walletName,
      balance: walletBalance,
      plan: walletPlan,
      walletType: customWalletType || walletType,
      collaborators: walletPlan === 'Shared' ? collaborators : []
    };
    
    navigate('/onboarding', { 
      state: { 
        step: 'wallet',
        walletData: walletDataToPass
      } 
    });
  };

  const handleAddCollaborator = () => {
    if (collaboratorInput.trim()) {
      const input = collaboratorInput.trim();
      const newCollaborator = {
        id: Date.now().toString(),
        name: input.includes('@') ? input.split('@')[0] : input,
        email: input.includes('@') ? input : `${input}@example.com`,
        role: 'Editor'
      };
      setCollaborators([...collaborators, newCollaborator]);
      setCollaboratorInput('');
    }
  };

  const handleRemoveCollaborator = (id: string) => {
    setCollaborators(collaborators.filter(c => c.id !== id));
  };

  const handleRoleChange = (id: string, newRole: string) => {
    setCollaborators(collaborators.map(c => 
      c.id === id ? { ...c, role: newRole } : c
    ));
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
        const parent = e.currentTarget.parentElement;
        if (!parent) return;
        const select = parent.querySelector('select');
        if (select) triggerSelectDropdown(select);
      }, 50);
      return;
    }
    
    const parent = e.currentTarget.parentElement;
    if (!parent) return;
    const select = parent.querySelector('select');
    if (select) triggerSelectDropdown(select);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddCollaborator();
    }
  };

  return (
    <div className="wallet-page">
      <div className="wallet-container">
        <div className="wallet-header">
          <button className="wallet-back" type="button" onClick={() => navigate('/onboarding', { state: { step: 'wallet' } })}>
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
                  placeholder={walletName || !hasInteracted.name ? 'Enter wallet name' : ''}
                  value={walletName}
                  onChange={handleNameChange}
                  onFocus={() => setHasInteracted(prev => ({ ...prev, name: true }))}
                  onBlur={() => {
                    if (!walletName.trim()) {
                      setHasInteracted(prev => ({ ...prev, name: false }));
                    }
                  }}
                />
              </div>
              <div className="wallet-field">
                <label>Wallet Balance</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={walletBalance || !hasInteracted.balance ? '0.00' : ''}
                  value={walletBalance}
                  onChange={handleBalanceChange}
                  onFocus={() => setHasInteracted(prev => ({ ...prev, balance: true }))}
                  onBlur={() => {
                    if (!walletBalance.trim()) {
                      setHasInteracted(prev => ({ ...prev, balance: false }));
                    }
                  }}
                />
              </div>
              <div className="wallet-field">
                <label>Wallet Type</label>
                <div className="wallet-select">
                  {walletType === 'Custom' ? (
                    <>
                      <input
                        type="text"
                        className="wallet-select-input"
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
                        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
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
                      <div className="wallet-select-display" onClick={(e) => e.preventDefault()}>
                        {walletType || 'Select type'}
                      </div>
                      <select 
                        value={walletType} 
                        onChange={handleWalletTypeSelect}
                        className="wallet-select-hidden"
                        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: '100%', height: '100%' }}
                      >
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
                  <div className="wallet-select-display" onClick={(e) => e.preventDefault()}>
                    {walletPlan || 'Select plan'}
                  </div>
                  <select 
                    value={walletPlan} 
                    onChange={(e) => setWalletPlan(e.target.value)}
                    className="wallet-select-hidden"
                    style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: '100%', height: '100%' }}
                  >
                    {WALLET_PLANS.map((plan) => (
                      <option key={plan} value={plan}>
                        {plan}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="wallet-arrow-button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const parent = e.currentTarget.parentElement;
                      if (!parent) return;
                      const select = parent.querySelector('select');
                      if (select) triggerSelectDropdown(select);
                    }}
                    aria-label="Change wallet plan"
                  >
                    <FaChevronDown className="wallet-arrow" />
                  </button>
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

      {showShareModal && (
        <div className="wallet-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="wallet-modal-title">Share '{walletName || 'Wallet Name'}'</h2>
            
            <div className="wallet-modal-input-wrapper">
              <input
                type="text"
                className="wallet-modal-input"
                placeholder="Add collaborators (email or username)"
                value={collaboratorInput}
                onChange={(e) => setCollaboratorInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              {collaboratorInput.trim() && (
                <button
                  type="button"
                  className="wallet-modal-add-btn"
                  onClick={handleAddCollaborator}
                >
                  Add
                </button>
              )}
            </div>

            <div className="wallet-modal-section">
              <h3 className="wallet-modal-section-title">People with access</h3>
              
              <div className="wallet-modal-person">
                <div className="wallet-modal-person-avatar">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="16" fill="#e2e8f0"/>
                    <path d="M16 10C17.1046 10 18 10.8954 18 12C18 13.1046 17.1046 14 16 14C14.8954 14 14 13.1046 14 12C14 10.8954 14.8954 10 16 10Z" fill="#4a5568"/>
                    <path d="M16 16C18.2091 16 20 14.2091 20 12C20 9.79086 18.2091 8 16 8C13.7909 8 12 9.79086 12 12C12 14.2091 13.7909 16 16 16Z" fill="#4a5568"/>
                    <path d="M22 22C22 19.7909 20.2091 18 18 18H14C11.7909 18 10 19.7909 10 22V24H22V22Z" fill="#4a5568"/>
                  </svg>
                </div>
                <div className="wallet-modal-person-info">
                  <div className="wallet-modal-person-name">{owner.name}</div>
                  <div className="wallet-modal-person-email">{owner.email}</div>
                </div>
                <div className="wallet-modal-person-role">{owner.role}</div>
              </div>

              {collaborators.map((collaborator) => (
                <div key={collaborator.id} className="wallet-modal-person">
                  <div className="wallet-modal-person-avatar">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="16" cy="16" r="16" fill="#e2e8f0"/>
                      <path d="M16 10C17.1046 10 18 10.8954 18 12C18 13.1046 17.1046 14 16 14C14.8954 14 14 13.1046 14 12C14 10.8954 14.8954 10 16 10Z" fill="#4a5568"/>
                      <path d="M16 16C18.2091 16 20 14.2091 20 12C20 9.79086 18.2091 8 16 8C13.7909 8 12 9.79086 12 12C12 14.2091 13.7909 16 16 16Z" fill="#4a5568"/>
                      <path d="M22 22C22 19.7909 20.2091 18 18 18H14C11.7909 18 10 19.7909 10 22V24H22V22Z" fill="#4a5568"/>
                    </svg>
                  </div>
                  <div className="wallet-modal-person-info">
                    <div className="wallet-modal-person-name">{collaborator.name}</div>
                    <div className="wallet-modal-person-email">{collaborator.email}</div>
                  </div>
                  <div className="wallet-modal-person-role-select">
                    <select
                      value={collaborator.role}
                      onChange={(e) => handleRoleChange(collaborator.id, e.target.value)}
                      className="wallet-modal-role-dropdown"
                    >
                      <option value="Viewer">Viewer</option>
                      <option value="Editor">Editor</option>
                    </select>
                    <FaChevronDown className="wallet-modal-role-arrow" />
                  </div>
                  <button
                    className="wallet-modal-remove"
                    type="button"
                    onClick={() => handleRemoveCollaborator(collaborator.id)}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="wallet-modal-footer">
              <button className="wallet-modal-done" type="button" onClick={() => setShowShareModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
