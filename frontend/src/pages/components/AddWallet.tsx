import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronDown, FaEye, FaEyeSlash, FaUsers, FaWallet } from 'react-icons/fa';
import { FiTrash2 } from 'react-icons/fi';
import type { Collaborator } from '../../utils/shared';
import { CURRENCY_SYMBOLS, formatAmount, formatAmountNoTrailing, triggerSelectDropdown, validateAndFormatAmount } from '../../utils/shared';
import { useAppState } from '../../state/AppStateContext';
// Inlined CollaboratorModal from CollaboratorModal.tsx
import { FaChevronDown as FaChevronDownCollab } from 'react-icons/fa';
import type { Collaborator as CollaboratorType } from '../../utils/shared';

interface CollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  collaborators: CollaboratorType[];
  onAddCollaborator: (input: string) => void;
  onRemoveCollaborator: (firebaseUid: string) => void;
  onRoleChange: (firebaseUid: string, role: string) => void;
  ownerName?: string;
  ownerEmail?: string;
  ownerUid?: string;
  variant?: 'wallet' | 'budget';
}

function CollaboratorModal({
  isOpen,
  onClose,
  title,
  collaborators,
  onAddCollaborator,
  onRemoveCollaborator,
  onRoleChange,
  ownerName = 'FirstName LastName',
  ownerEmail = 'useroneeeeeeeee@gmail.com',
  ownerUid,
  variant = 'wallet',
  searchQuery,
  searchResults,
  onSearchChange
}: CollaboratorModalProps & { searchQuery: string; searchResults: any[]; onSearchChange: (query: string) => void }) {
  const [collaboratorInput, setCollaboratorInput] = useState('');

  const handleAddClick = () => {
    if (collaboratorInput.trim()) {
      onAddCollaborator(collaboratorInput.trim());
      setCollaboratorInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddClick();
    }
  };

  if (!isOpen) return null;

  if (variant === 'wallet') {
    return (
      <div className="wallet-modal-overlay">
        <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
          <h2 className="wallet-modal-title">Share '{title}'</h2>
          <div className="wallet-modal-input-wrapper">
            <input
              type="text"
              className="wallet-modal-input"
              placeholder="Add collaborators (email or username)"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery.trim() && searchResults.length > 0 && (
              <div className="search-suggestions">
                {searchResults.map((user) => (
                  <div
                    key={user.firebaseUid}
                    className="search-suggestion"
                    onClick={() => onAddCollaborator(user.email)}
                  >
                    <div className="suggestion-name">{user.name}</div>
                    <div className="suggestion-details">{user.username} • {user.email}</div>
                  </div>
                ))}
              </div>
            )}
            {searchQuery.trim() && searchResults.length === 0 && (
              <div className="no-results">No users found.</div>
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
              <div className="wallet-modal-person-name">{ownerName}</div>
              <div className="wallet-modal-person-email">{ownerEmail}</div>
              </div>
              <div className="wallet-modal-person-role">Owner</div>
            </div>
            {collaborators.filter(c => !ownerUid || c.firebaseUid !== ownerUid).map((collaborator) => (
              <div key={collaborator.firebaseUid} className="wallet-modal-person">
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
                    onChange={(e) => onRoleChange(collaborator.firebaseUid, e.target.value)}
                    className="wallet-modal-role-dropdown"
                  >
                    <option value="Viewer">Viewer</option>
                    <option value="Editor">Editor</option>
                  </select>
                  <FaChevronDownCollab className="wallet-modal-role-arrow" />
                </div>
                <button
                  className="wallet-modal-remove"
                  type="button"
                  onClick={() => onRemoveCollaborator(collaborator.firebaseUid)}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="wallet-modal-footer">
            <button className="wallet-modal-done" type="button" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="budget-modal-overlay">
      <div className="budget-modal" onClick={(e) => e.stopPropagation()}>
        <div className="budget-modal-header">
          <h2>Manage Collaborators</h2>
          <button 
            type="button" 
            className="budget-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="budget-modal-content">
          <p className="budget-modal-subtitle">
            Add people to share this budget with. Changes will reflect in both wallet and budget.
          </p>
          <div className="budget-collaborator-input-wrapper">
            <div className="budget-collaborator-input-row">
              <input
                type="text"
                placeholder="Enter name or email"
                value={collaboratorInput}
                onChange={(e) => setCollaboratorInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="budget-collaborator-input"
              />
              <button
                type="button"
                onClick={handleAddClick}
                className="budget-add-collaborator-btn"
                disabled={!collaboratorInput.trim()}
              >
                Add
              </button>
            </div>
            {searchQuery.trim() && searchResults.length === 0 && (
              <div className="no-results">No users found.</div>
            )}
          </div>
          <div className="budget-collaborators-list-modal">
            <div className="budget-collaborator-item-modal owner">
              <div className="budget-collaborator-info-modal">
                <span className="budget-collaborator-name-modal">You (Owner)</span>
                <span className="budget-collaborator-email-modal">Current User</span>
              </div>
              <span className="budget-collaborator-role-modal">Owner</span>
            </div>
            {collaborators.map((collaborator: CollaboratorType) => (
              <div key={collaborator.firebaseUid} className="budget-collaborator-item-modal">
                <div className="budget-collaborator-info-modal">
                  <span className="budget-collaborator-name-modal">{collaborator.name}</span>
                  <span className="budget-collaborator-email-modal">{collaborator.email}</span>
                </div>
                <div className="budget-collaborator-actions">
                  <select
                    value={collaborator.role}
                    onChange={(e) => onRoleChange(collaborator.firebaseUid, e.target.value)}
                    className="budget-role-select"
                  >
                    <option value="Editor">Editor</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => onRemoveCollaborator(collaborator.firebaseUid)}
                    className="budget-remove-btn"
                    title="Remove collaborator"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="budget-modal-done-btn"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
import * as walletService from '../../services/walletService';
import * as budgetService from '../../services/budgetService';
import { useCurrency } from '../../hooks/useCurrency';
import * as userService from '../../services/userService';

// CONSTANTS

export const WALLET_TEMPLATES = [
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
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [showPlanChangeModal, setShowPlanChangeModal] = useState<boolean>(false);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { currentUser } = useAppState();
  const { currency: selectedCurrency } = useCurrency();
  const currencySymbol = CURRENCY_SYMBOLS[selectedCurrency] || '₱';

  // Determine the true owner from collaborators (role === 'Owner') when available
  const ownerFromCollaborators = collaborators.find(c => c.role === 'Owner') || null;
  const ownerNameToShow = ownerFromCollaborators ? ownerFromCollaborators.name : currentUser.name;
  const ownerEmailToShow = ownerFromCollaborators ? ownerFromCollaborators.email : currentUser.email;
  const ownerUidToShow = ownerFromCollaborators ? ownerFromCollaborators.firebaseUid : currentUser.id;

  // Only initialize wallet state from existingWallet on first mount
  const didInit = useRef(false);
  useEffect(() => {
    if (editMode && existingWallet && !didInit.current) {
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

      // Always initialize color fields from wallet data, fallback to defaults if missing
      setBackgroundColor(existingWallet.backgroundColor || existingWallet.color1 || '#e2e8f0');
      setTextColor(existingWallet.textColor || '#1a1a1a');

      // Only select a template if both name and colors match a template
      const match = WALLET_TEMPLATES.find(
        t => t.name === existingWallet.template &&
        t.bgColor === (existingWallet.backgroundColor || existingWallet.color1) &&
        t.textColor === (existingWallet.textColor || '#1a1a1a')
      );
      setSelectedTemplate(match ? match.name : '');

      if (existingWallet.collaborators && existingWallet.collaborators.length > 0) {
        setCollaborators(existingWallet.collaborators);
      }

      setHasInteracted({ name: true, balance: true, walletType: true });
      didInit.current = true;
    }
  }, [editMode, existingWallet]);

  useEffect(() => {
    if (walletPlan === 'Personal') {
      setShowShareModal(false);
      if (!editMode) {
        setCollaborators([]);
      }
    }
  }, [walletPlan, editMode]);

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // normalize input: allow only numbers and a single decimal point, max 2 decimals
    const cleaned = validateAndFormatAmount(e.target.value);
    setWalletBalance(cleaned);
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

  // When user customizes color, clear template selection
  const handleBackgroundColorChange = (color: string) => {
    setBackgroundColor(color);
    // If color doesn't match any template, clear template selection
    const match = WALLET_TEMPLATES.find(t => t.bgColor === color && t.textColor === textColor);
    setSelectedTemplate(match ? match.name : '');
  };
  const handleTextColorChange = (color: string) => {
    setTextColor(color);
    const match = WALLET_TEMPLATES.find(t => t.bgColor === backgroundColor && t.textColor === color);
    setSelectedTemplate(match ? match.name : '');
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

  const handleSave = async () => {
    const missing = validateWallet();
    if (missing.length > 0) return;
    
    const walletData = {
      name: walletName,
      balance: walletBalance,
      plan: walletPlan,
      walletType: customWalletType || walletType,
      collaborators: walletPlan === 'Shared' ? collaborators : [],
      backgroundColor: backgroundColor,
      textColor: textColor,
      color1: backgroundColor,
      color2: backgroundColor,
      template: selectedTemplate || '', // Always save template, even if empty
    };

    if (returnTo === '/onboarding/wallet') {
      const walletDataToPass = {
        id: editMode && existingWallet?.id ? existingWallet.id : Date.now().toString(),
        ...walletData
      };
      navigate(returnTo, {
        state: {
          walletData: walletDataToPass,
          walletIndex: editMode ? walletIndex : undefined
        }
      });
      return;
    }

    try {
      if (editMode && existingWallet?.id) {
        await walletService.updateWallet(existingWallet.id, {
          ...walletData,
          plan: walletPlan as "Personal" | "Shared"
        });
      } else {
        await walletService.createWallet({
          ...walletData,
          plan: walletPlan as "Personal" | "Shared"
        });
      }      // Update budgets if wallet name changed
      if (editMode && existingWallet?.name && existingWallet.name !== walletName) {
        try {
          const budgets = await budgetService.getBudgets();
          const targetNames = new Set<string>([walletName, existingWallet.name]);
          for (const budget of budgets) {
            if (budget.plan === 'Shared' && targetNames.has(budget.wallet)) {
              await budgetService.updateBudget(budget.id!, { collaborators });
          }
          }
        } catch (err) {
          console.error('Failed to update budgets:', err);
      }
      }

    try {
      window.dispatchEvent(new CustomEvent('data-updated', { detail: { source: 'wallet-save' } }));
    } catch {}

    navigate(returnTo);
    } catch (err) {
      console.error('Failed to save wallet:', err);
      alert('Failed to save wallet. Please try again.');
    }
  };

  const handleDeleteWallet = async () => {
    if (!existingWallet) return;
    try {
      await walletService.deleteWallet(existingWallet.id);
      setShowDeleteModal(false);
      navigate(returnTo);
      window.dispatchEvent(new CustomEvent('data-updated', { detail: { source: 'wallet-delete' } }));
    } catch (err) {
      console.error('Failed to delete wallet:', err);
      alert('Failed to delete wallet. Please try again.');
    }
  };

  const handleAddCollaborator = (input: string) => {
    // Find the user from search results
    const user = searchResults.find(u => u.email === input || u.username === input);
    if (user) {
      // Check if already added
      if (collaborators.some(c => c.firebaseUid === user.firebaseUid)) {
        return;
      }
      const newCollaborator = {
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        role: 'Editor'
      };
      setCollaborators([...collaborators, newCollaborator]);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleRemoveCollaborator = (firebaseUid: string) => {
    setCollaborators(collaborators.filter(c => c.firebaseUid !== firebaseUid));
  };

  const handleRoleChange = (firebaseUid: string, newRole: string) => {
    setCollaborators(collaborators.map(c => 
      c.firebaseUid === firebaseUid ? { ...c, role: newRole } : c
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
    // ensure native select closes after choosing an option (mirror wallet plan behavior)
    try { (e.target as HTMLSelectElement).blur(); } catch {}
  };

  const handleCustomWalletTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomWalletType(e.target.value);
  };

  const handleCustomWalletTypeBlur = () => {
    if (!customWalletType.trim()) {
      setHasInteracted(prev => ({ ...prev, walletType: false }));
    }
  };

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      try {
        const results = await userService.searchUsers(query);
        setSearchResults(results);
      } catch (err) {
        console.error('Failed to search users:', err);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
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
          {editMode && (returnTo === '/personal' || returnTo === '/shared') && (
            <button
              className="wallet-delete-btn"
              type="button"
              onClick={() => setShowDeleteModal(true)}
              title="Delete wallet"
              aria-label="Delete wallet"
            >
              <FiTrash2 />
            </button>
          )}
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
              <div className="wallet-balance">{showBalance ? `${currencySymbol}${formatAmountNoTrailing(walletBalance || '0')}` : `${currencySymbol}••••`}</div>
              <div className="wallet-name">{walletName || 'Wallet'}</div>
              <div className="wallet-plan">{walletPlan || 'Plan Mode Budget'}</div>
              <div className="wallet-icon" aria-hidden>
                <FaWallet aria-hidden className="wallet-icon-svg" />
              </div>
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
                    placeholder={walletBalance || !hasInteracted.balance ? '0' : ''}
                    value={walletBalance ? formatAmount(walletBalance) : walletBalance}
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
                <div
                  className="wallet-select"
                  onClick={(e) => {
                    // If the click came from inside the native select (option click),
                    // don't re-trigger the dropdown — that causes the options to stay open.
                    const rawTarget = e.target as HTMLElement | null;
                    if (rawTarget && rawTarget.closest && rawTarget.closest('select')) {
                      return;
                    }

                    // If custom is selected, focus the visible input so the user can type.
                    // Otherwise trigger the native select dropdown.
                    const wrapper = e.currentTarget as HTMLElement;
                    if (walletType === 'Custom') {
                      const input = wrapper.querySelector('input.wallet-select-input') as HTMLInputElement | null;
                      if (input) input.focus();
                      return;
                    }
                    const select = wrapper.querySelector('select') as HTMLSelectElement | null;
                    if (select) triggerSelectDropdown(select);
                  }}
                >
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
                {WALLET_TEMPLATES.map((template) => {
                  const isSelected =
                    selectedTemplate === template.name &&
                    backgroundColor === template.bgColor &&
                    textColor === template.textColor;
                  return (
                    <button
                      key={template.name}
                      className={`wallet-template${isSelected ? ' selected' : ''}`}
                      type="button"
                      onClick={() => handleTemplateSelect(template)}
                      style={{ backgroundColor: template.bgColor, color: template.textColor }}
                    >
                      {template.name}
                    </button>
                  );
                })}
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
                      onChange={e => handleBackgroundColorChange(e.target.value)}
                      className="wallet-color-input"
                    />
                  </div>
                </div>
                <div className="wallet-field">
                  <label>Text Color</label>
                  <div className="wallet-color">
                    <input
                      type="color"
                      value={textColor}
                      onChange={e => handleTextColorChange(e.target.value)}
                      className="wallet-color-input"
                    />
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
        ownerName={ownerNameToShow}
        ownerEmail={ownerEmailToShow}
        ownerUid={ownerUidToShow}
        searchQuery={searchQuery}
        searchResults={searchResults}
        onSearchChange={handleSearchUsers}
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

      {showDeleteModal && (
        <div className="wallet-modal-overlay" role="dialog" aria-modal="true">
          <div className="wallet-modal">
            <h3 className="wallet-modal-title">Delete Wallet</h3>
            <p className="wallet-confirm-text">
              Are you sure you want to delete the wallet "{walletName}"? This action cannot be undone.
            </p>
            <div className="wallet-confirm-actions">
              <button type="button" className="wallet-modal-btn secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button type="button" className="wallet-modal-btn" onClick={handleDeleteWallet}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
