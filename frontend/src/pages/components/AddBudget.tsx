import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronDown, FaUsers, FaInfoCircle, FaCalendarAlt } from 'react-icons/fa';
import { FiTrash2 } from 'react-icons/fi';
import type { Collaborator, Wallet } from '../../utils/shared';
import {
  getDaysInMonth,
  calculateDateRange,
  formatDate,
  triggerSelectDropdown,
  formatAmount,
  validateAndFormatAmount,
  CURRENCY_SYMBOLS
} from '../../utils/shared';
import { useAppState } from '../../state/AppStateContext';
import { useCurrency } from '../../hooks/useCurrency';
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
}: CollaboratorModalProps & { searchQuery?: string; searchResults?: any[]; onSearchChange?: (q: string) => void }) {
  const [collaboratorInput, setCollaboratorInput] = useState('');
  // Accept optional external search props via rest/props (passed from parent)
  // Note: we don't add them to the interface explicitly here to keep compatible, but will read from props below if provided.

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

  // Use the same markup and classes for both wallet and budget variants for consistent style
  return (
    <div className="wallet-modal-overlay">
      <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="wallet-modal-title">{variant === 'wallet' ? `Share '${title}'` : 'Manage Collaborators'}</h2>
        <div className="wallet-modal-input-wrapper">
          <div className="wallet-modal-input-row">
            <input
              type="text"
              className="wallet-modal-input"
              placeholder={variant === 'wallet' ? 'Add collaborators (email or username)' : 'Enter name or email'}
              value={typeof searchQuery === 'string' ? searchQuery : collaboratorInput}
              onChange={(e) => {
                const v = e.target.value;
                if (onSearchChange) {
                  onSearchChange(v);
                } else {
                  setCollaboratorInput(v);
                }
              }}
              onKeyPress={handleKeyPress}
            />
            {(!onSearchChange ? collaboratorInput : (searchQuery || '')).trim() && (
              <button
                type="button"
                className="wallet-modal-add-btn"
                onClick={() => {
                  // prefer adding from external suggestions when provided
                  if (onSearchChange && searchQuery) {
                    onAddCollaborator(searchQuery);
                    onSearchChange('');
                  } else {
                    onAddCollaborator(collaboratorInput.trim());
                  }
                  setCollaboratorInput('');
                }}
              >
                Add
              </button>
            )}
          </div>

          {typeof searchQuery === 'string' && searchQuery.trim() && (
            <>
              {searchResults && searchResults.length > 0 ? (
                <div className="search-suggestions">
                  {searchResults.map((user) => (
                    <div
                      key={user.firebaseUid}
                      className="search-suggestion"
                      onClick={() => {
                        onAddCollaborator(user.email);
                        if (onSearchChange) onSearchChange('');
                        else setCollaboratorInput('');
                      }}
                    >
                      <div className="suggestion-name">{user.name}</div>
                      <div className="suggestion-details">{user.username} • {user.email}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-results">No users found.</div>
              )}
            </>
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
import * as walletService from '../../services/walletService';
import * as budgetService from '../../services/budgetService';
import * as customCategoryService from '../../services/customCategoryService';
import * as userService from '../../services/userService';

// CONSTANTS

const BUDGET_CATEGORIES_BASE = [
  'Food',
  'Shopping',
  'Bills',
  'Car',
  'Custom'
] as const;

const BUDGET_PERIODS = ['Weekly', 'Monthly', 'One-time'] as const;

// TYPES

interface HasInteracted {
  amount: boolean;
  category: boolean;
  description: boolean;
}

// COMPONENT

export default function AddBudget() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logActivity, currentUser } = useAppState();
  
  const editMode = location.state?.editMode || false;
  const budgetIndex = location.state?.budgetIndex;
  const existingBudget = location.state?.budgetData;
  const budgetPlan = location.state?.budgetPlan;
  const lockWalletName = location.state?.lockWalletName as string | undefined;
  const returnTo = location.state?.returnTo || '/onboarding/budget';

  const [allWallets, setAllWallets] = useState<Wallet[]>([]);

  useEffect(() => {
    const loadWallets = async () => {
    if (returnTo === '/dashboard' || returnTo === '/personal' || returnTo === '/shared') {
        try {
          const wallets = await walletService.getWallets();
          setAllWallets(wallets.map(w => ({
            id: String(w.id || w._id || ''),
            name: w.name,
            plan: w.plan,
            balance: w.balance,
            type: w.walletType,
            collaborators: w.collaborators
          })));
        } catch (err) {
          console.error('Failed to load wallets:', err);
          setAllWallets([]);
    }
      } else {
    const onboardingWallets = sessionStorage.getItem('onboardingWallets');
        setAllWallets(onboardingWallets ? JSON.parse(onboardingWallets) : []);
      }
  };
    loadWallets();
  }, [returnTo]);
  
  const hasWalletSelectionDashboard = returnTo === '/dashboard' && allWallets.some(w => w.plan === 'Shared');
  const sharedWallets = allWallets.filter(w => w.plan === 'Shared');
  const personalWalletsExist = allWallets.some(w => w.plan === 'Personal');
  const hasWalletSelectionOnboarding = returnTo !== '/dashboard' && sharedWallets.length > 0;
  const hasWalletSelectionShared = budgetPlan === 'Shared' && sharedWallets.length > 1;
  const showWalletSelection = !editMode && !lockWalletName && (hasWalletSelectionDashboard || hasWalletSelectionOnboarding || hasWalletSelectionShared);
  
  // State
  const [selectedWallet, setSelectedWallet] = useState<string>(() => lockWalletName ? lockWalletName : '');
  const [selectedWalletData, setSelectedWalletData] = useState<Wallet | null>(null);
  const [budgetAmount, setBudgetAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [period, setPeriod] = useState<string>('Monthly');
  const [description, setDescription] = useState<string>('');
  const [hasInteracted, setHasInteracted] = useState<HasInteracted>({ 
    amount: false, 
    category: false, 
    description: false 
  });
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showWalletChangeModal, setShowWalletChangeModal] = useState<boolean>(false);
  const [pendingWalletName, setPendingWalletName] = useState<string>('');

  const { currency } = useCurrency();
  const currencySymbol = CURRENCY_SYMBOLS[currency] || '₱';

  const isSharedBudget = (selectedWalletData?.plan || budgetPlan) === 'Shared';

  // Determine true owner from collaborators list when available
  const ownerFromCollaborators = collaborators.find(c => c.role === 'Owner') || null;
  const ownerNameToShow = ownerFromCollaborators ? ownerFromCollaborators.name : currentUser?.name || '';
  const ownerEmailToShow = ownerFromCollaborators ? ownerFromCollaborators.email : currentUser?.email || '';
  const ownerUidToShow = ownerFromCollaborators ? ownerFromCollaborators.firebaseUid : currentUser?.id || '';

  // Compute date range: start is either customStartDate or first day of current month; end is computed from start + period
  const computeEndFromStart = (periodType: string, start: Date): Date => {
    const end = new Date(start);
    switch (periodType) {
      case 'Weekly':
        end.setDate(start.getDate() + 6);
        return end;
      case 'Monthly':
        // Add one month then subtract one day so the range covers roughly one month from start
        end.setMonth(start.getMonth() + 1);
        end.setDate(end.getDate() - 1);
        return end;
      case 'One-time':
        return new Date(start);
      default:
        // Fallback to period-based calculateDateRange for unknown types
        return calculateDateRange(periodType, start).endDate;
    }
  };

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startDate = customStartDate || firstOfMonth;
  const endDate = customEndDate || computeEndFromStart(period, startDate);
  const validateBudget = () => {
    const missing: string[] = [];
    const nextErrors: Record<string, string> = {};
    if (showWalletSelection && !selectedWallet) { missing.push('Wallet'); nextErrors.wallet = 'Please select a wallet.'; }
    if (!budgetAmount.trim()) { missing.push('Budget Amount'); nextErrors.amount = 'Budget amount is required.'; }
    if (!(customCategory || category)) { missing.push('Category'); nextErrors.category = 'Please select a category.'; }
    if (!period) { missing.push('Period'); nextErrors.period = 'Please select a period.'; }
    setErrors(nextErrors);
    return missing;
  };


  useEffect(() => {
    if (lockWalletName) {
      const wallet = allWallets.find(w => w.name === lockWalletName);
      if (wallet) {
        setSelectedWallet(lockWalletName);
        setSelectedWalletData(wallet);
        if (wallet.collaborators) setCollaborators(wallet.collaborators);
      }
      return;
    }
    if (!editMode) {
      if (budgetPlan) {
        if (budgetPlan === 'Personal') {
          setSelectedWallet('Personal Wallets');
          setSelectedWalletData({ plan: 'Personal' } as Wallet);
        } else if (budgetPlan === 'Shared' && sharedWallets.length === 1) {
          const wallet = sharedWallets[0];
          setSelectedWallet(wallet.name);
          setSelectedWalletData(wallet);
          if (wallet.collaborators) setCollaborators(wallet.collaborators);
        }
      } else {
        // Dashboard: if opened from dashboard and there are shared wallets,
        // default to the first shared wallet so created shared budgets are linked
        if (returnTo === '/dashboard' && sharedWallets.length > 0) {
          const wallet = sharedWallets[0];
          setSelectedWallet(wallet.name);
          setSelectedWalletData(wallet);
          if (wallet.collaborators) setCollaborators(wallet.collaborators);
        } else if (allWallets.length === 1 && allWallets[0].plan === 'Personal') {
          // If there are only personal wallets and no shared wallets, default to Personal Wallets
          setSelectedWallet('Personal Wallets');
          setSelectedWalletData({ plan: 'Personal' } as Wallet);
        } else if (!allWallets.some(w => w.plan === 'Shared') && personalWalletsExist) {
          setSelectedWallet('Personal Wallets');
          setSelectedWalletData({ plan: 'Personal' } as Wallet);
        }
      }
    }
  }, [allWallets, editMode, budgetPlan, lockWalletName, sharedWallets.length, personalWalletsExist]);

  useEffect(() => {
    if (editMode && existingBudget) {
      const walletName = existingBudget.wallet || '';
      setSelectedWallet(walletName);
      
      const wallet = allWallets.find((w: Wallet) => w.name === walletName);
      if (wallet) {
        setSelectedWalletData(wallet);
      } else if (!walletName && (existingBudget.plan === 'Personal' || budgetPlan === 'Personal')) {
        setSelectedWallet('Personal Wallets');
        setSelectedWalletData({ plan: 'Personal' } as Wallet);
      }
      
      setBudgetAmount(existingBudget.amount || '');
      setCategory(existingBudget.category || '');
      setPeriod(existingBudget.period || 'Monthly');
      setDescription(existingBudget.description || '');
      
      if (existingBudget.startDate) {
        setCustomStartDate(new Date(existingBudget.startDate));
      }
      if (existingBudget.endDate) {
        setCustomEndDate(new Date(existingBudget.endDate));
      }
      
      if (existingBudget.collaborators && existingBudget.collaborators.length > 0) {
        setCollaborators(existingBudget.collaborators);
      }
      
      setHasInteracted({ amount: true, category: true, description: true });
    }
  }, [editMode, existingBudget]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = validateAndFormatAmount(e.target.value);
    setBudgetAmount(cleaned);
    setHasInteracted(prev => ({ ...prev, amount: true }));
  };

  const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'Custom') {
      setCategory('Custom');
      setCustomCategory('');
      setHasInteracted(prev => ({ ...prev, category: true }));
    } else {
      setCategory(value);
      setCustomCategory('');
    }
  };

  const handleCustomCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomCategory(e.target.value);
  };

  const handleCustomCategoryBlur = () => {
    if (!customCategory.trim()) {
      setHasInteracted(prev => ({ ...prev, category: false }));
    }
  };

  const handleDropdownClick = (e: React.MouseEvent<HTMLButtonElement>, selectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (category === 'Custom' && selectId === 'category') {
      setCategory('');
      setCustomCategory('');
      setHasInteracted(prev => ({ ...prev, category: false }));
      
      setTimeout(() => {
        const parent = e.currentTarget.parentElement;
        if (!parent) return;
        const select = parent.querySelector('select') as HTMLSelectElement | null;
        if (select) triggerSelectDropdown(select);
      }, 50);
      return;
    }
    
    const parent = e.currentTarget.parentElement;
    if (!parent) return;
    const select = parent.querySelector('select') as HTMLSelectElement | null;
    if (select) triggerSelectDropdown(select);
  };

  const handleSave = async () => {
    const missing = validateBudget();
    if (missing.length > 0) return;
    const newAmountNum = parseFloat(budgetAmount || '0') || 0;
    const prevAmountNum = parseFloat(existingBudget?.amount || '0') || 0;
    const prevLeftNum = parseFloat(existingBudget?.left ?? existingBudget?.amount ?? '0') || 0;
    const previouslySpent = Math.max(prevAmountNum - prevLeftNum, 0);
    const recalculatedLeftNum = Math.max(newAmountNum - previouslySpent, 0);
    const nextLeft = (editMode
      ? recalculatedLeftNum
      : newAmountNum).toFixed(2);
    const chosenCategory = customCategory || category;
    if (customCategory) {
      try {
        await customCategoryService.createCustomCategory(customCategory);
      } catch (err) {
        console.error('Failed to save custom category:', err);
        }
    }
    const resolvedWalletName = lockWalletName
      || existingBudget?.wallet
      || selectedWallet
      || selectedWalletData?.name
      || '';

    const planForBudget = (budgetPlan === 'Shared')
      || (selectedWalletData?.plan === 'Shared')
      || (existingBudget?.plan === 'Shared')
      ? 'Shared'
      : 'Personal';

    const budgetData = {
      wallet: resolvedWalletName,
      plan: planForBudget as 'Personal' | 'Shared',
      amount: budgetAmount,
      category: chosenCategory,
      period: period as 'Monthly' | 'Weekly' | 'One-time',
      description: description,
      startDate: customStartDate || undefined,
      endDate: customEndDate || undefined,
      left: nextLeft,
      collaborators: planForBudget === 'Shared' ? collaborators : []
    };
    
    if (returnTo === '/dashboard' || returnTo === '/personal' || returnTo === '/shared') {
      try {
        let savedBudget;
        console.log('Creating budget payload:', budgetData);
        if (editMode && existingBudget?.id) {
          savedBudget = await budgetService.updateBudget(existingBudget.id, budgetData);
        } else {
          savedBudget = await budgetService.createBudget(budgetData);
        }
        console.log('Budget save response:', savedBudget);

        try { window.dispatchEvent(new CustomEvent('data-updated', { detail: { source: 'budget-save' } })); } catch {}

        if (budgetData.plan === 'Shared') {
          const walletIdForLog = selectedWalletData?.id || budgetData.wallet || 'shared-wallet';
          const amountLabel = `${currencySymbol} ${formatAmount(budgetData.amount || '0')}`;
          await logActivity({
          walletId: walletIdForLog,
          action: editMode ? 'budget_updated' : 'budget_added',
          entityType: 'budget',
            entityId: savedBudget.id || savedBudget._id || '',
            message: `${currentUser.name} ${editMode ? 'updated' : 'created'} the ${budgetData.category} budget (${amountLabel})`
        });
      }

        if (budgetData.plan === 'Shared' && resolvedWalletName) {
        try {
            const wallets = await walletService.getWallets();
            const wallet = wallets.find(w => w.name === resolvedWalletName && w.plan === 'Shared');
            if (wallet) {
              await walletService.updateWallet(wallet.id || wallet._id || '', { collaborators });
          }
            const budgets = await budgetService.getBudgets();
            for (const b of budgets) {
              if (b.plan === 'Shared' && b.wallet === resolvedWalletName) {
                await budgetService.updateBudget(b.id || b._id || '', { collaborators });
              }
          }
          } catch (err) {
            console.error('Failed to sync collaborators:', err);
          }
      }
      navigate(returnTo);
      } catch (err) {
        console.error('Failed to save budget:', err);
        alert('Failed to save budget. Please try again.');
      }
    } else {
      const budgetDataToPass = {
        id: editMode && existingBudget?.id ? existingBudget.id : Date.now().toString(),
        ...budgetData
      };
      if (budgetDataToPass.plan === 'Shared' && !returnTo.startsWith('/onboarding')) {
        const walletIdForLog = selectedWalletData?.id || budgetDataToPass.wallet || 'shared-wallet';
        const amountLabel = `${currencySymbol} ${formatAmount(budgetDataToPass.amount || '0')}`;
        await logActivity({
          walletId: walletIdForLog,
          action: editMode ? 'budget_updated' : 'budget_added',
          entityType: 'budget',
          entityId: budgetDataToPass.id,
          message: `${currentUser.name} ${editMode ? 'updated' : 'created'} the ${budgetDataToPass.category} budget (${amountLabel})`
        });
      }
      navigate(returnTo, { 
        state: { 
          budgetData: budgetDataToPass,
          budgetIndex: editMode ? budgetIndex : undefined
        } 
      });
    }
  };

  const handleDeleteBudget = async () => {
    if (!existingBudget) return;
    try {
      await budgetService.deleteBudget(existingBudget.id || existingBudget._id || existingBudget._id);
      setShowDeleteModal(false);
      navigate(returnTo);
      try { window.dispatchEvent(new CustomEvent('data-updated', { detail: { source: 'budget-delete' } })); } catch {}
    } catch (err) {
      console.error('Failed to delete budget:', err);
      alert('Failed to delete budget. Please try again.');
    }
  };

  const handleAddCollaborator = (input: string) => {
    // Only add real existing users (from search results)
    const user = searchResults.find((u) => u.email === input || u.username === input) || null;
    if (!user) return; // no matching user found
    if (collaborators.some(c => c.firebaseUid === user.firebaseUid)) return; // already added
    const newCollaborator = {
      firebaseUid: user.firebaseUid,
      name: user.name,
      email: user.email,
      role: 'Editor'
    } as Collaborator;
    setCollaborators([...collaborators, newCollaborator]);
    setSearchQuery('');
    setSearchResults([]);
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

  const handleRemoveCollaborator = (firebaseUid: string) => {
    setCollaborators(collaborators.filter(c => c.firebaseUid !== firebaseUid));
  };

  const handleRoleChange = (firebaseUid: string, newRole: string) => {
    setCollaborators(collaborators.map(c => 
      c.firebaseUid === firebaseUid ? { ...c, role: newRole } : c
    ));
  };

  const handleDateSelect = (date: Date) => {
    setCustomStartDate(date);
    
    let endDate: Date;
    
    switch (period) {
      case 'Weekly':
        endDate = new Date(date);
        endDate.setDate(date.getDate() + 6);
        break;
      case 'Monthly':
        endDate = new Date(date);
        endDate.setMonth(date.getMonth() + 1);
        endDate.setDate(date.getDate() - 1);
        break;
      case 'One-time':
        endDate = new Date(date);
        break;
      default:
        endDate = new Date(date);
    }
    
    setCustomEndDate(endDate);
    setShowCalendar(false);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
    const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();
    
    const days = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(calendarYear, calendarMonth, day);
      const isStartDate = customStartDate && date.toDateString() === customStartDate.toDateString();
      const isEndDate = customEndDate && date.toDateString() === customEndDate.toDateString();
      const isSelected = isStartDate || isEndDate;
      const isInRange = customStartDate && customEndDate && date > customStartDate && date < customEndDate;
      
      days.push(
        <button
          key={day}
          type="button"
          className={`calendar-day ${
            isSelected ? 'selected' : ''
          } ${isInRange ? 'in-range' : ''}`}
          onClick={() => handleDateSelect(date)}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  const confirmWalletChange = () => {
    const walletName = pendingWalletName;
    if (!walletName) {
      setShowWalletChangeModal(false);
      return;
    }
    setSelectedWallet(walletName);
    if (walletName === 'Personal Wallets') {
      setSelectedWalletData({ plan: 'Personal' } as Wallet);
      setCollaborators([]);
    } else {
      const wallet = allWallets.find(w => w.name === walletName);
      setSelectedWalletData(wallet || null);
      if (wallet?.collaborators) setCollaborators(wallet.collaborators); else setCollaborators([]);
    }
    setPendingWalletName('');
    setShowWalletChangeModal(false);
  };

  const cancelWalletChange = () => {
    setPendingWalletName('');
    setShowWalletChangeModal(false);
  };

  return (
    <div className="budget-page">
      <div className="budget-container">
        <div className="budget-header">
          <button 
            className="budget-back" 
            type="button" 
            onClick={() => navigate(returnTo)}
          >
            <FaChevronLeft />
          </button>
          <h1 className="budget-title">{editMode ? 'Edit Budget' : 'Add Budget'}</h1>
          {editMode && (returnTo === '/personal' || returnTo === '/shared') && (
            <button
              className="wallet-delete-btn"
              type="button"
              onClick={() => setShowDeleteModal(true)}
              title="Delete budget"
              aria-label="Delete budget"
            >
              <FiTrash2 />
            </button>
          )}
        </div>

        <div className="budget-content">
          <div className="budget-form">
            {/* Wallet Selection */}
            {showWalletSelection && (
              <div className="budget-field">
                <div className="budget-label-with-icon">
                  <label>Select Wallet</label>
                  {(isSharedBudget || sharedWallets.length > 0) && (
                    <button
                      type="button"
                      className="budget-shared-icon"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (selectedWalletData?.plan === 'Shared') {
                          setShowShareModal(true);
                        } else {
                          const parent = (e.currentTarget as HTMLElement).closest('.budget-select');
                          if (!parent) return;
                          const select = parent.querySelector('select') as HTMLSelectElement | null;
                          if (select) triggerSelectDropdown(select);
                        }
                      }}
                      title={selectedWalletData?.plan === 'Shared' ? 'Manage Collaborators' : 'Select a shared wallet to manage collaborators'}
                    >
                      <FaUsers />
                    </button>
                  )}
                </div>
                <div className="budget-select">
                  <div 
                    className={`budget-select-display ${errors.wallet ? 'input-error' : ''}`}
                    onClick={(e) => {
                      const parent = e.currentTarget.parentElement;
                      if (!parent) return;
                      const select = parent.querySelector('select');
                      if (select) triggerSelectDropdown(select);
                    }}
                  >
                    <span>
                      {selectedWallet || (budgetPlan === 'Shared' ? 'Select Shared Wallet' : 'Select Wallet')}
                    </span>
                    <button 
                      type="button"
                      onClick={(e) => handleDropdownClick(e, 'wallet')}
                      className="budget-select-arrow"
                    >
                      <FaChevronDown />
                    </button>
                  </div>
                  <select
                    value={selectedWallet}
                    onChange={(e) => {
                      const walletName = e.target.value;
                      setErrors(prev => ({...prev, wallet: ''}));
                      if (selectedWallet && walletName !== selectedWallet) {
                        setPendingWalletName(walletName);
                        setShowWalletChangeModal(true);
                        return;
                      }
                      setSelectedWallet(walletName);
                      if (walletName === 'Personal Wallets') {
                        setSelectedWalletData({ plan: 'Personal' } as Wallet);
                        setCollaborators([]);
                      } else {
                        const wallet = allWallets.find(w => w.name === walletName);
                        setSelectedWalletData(wallet || null);
                        if (wallet?.collaborators) setCollaborators(wallet.collaborators); else setCollaborators([]);
                      }
                    }}
                    className="budget-select-hidden"
                  >
                    <option value="" disabled hidden>{returnTo === '/dashboard' ? 'Select Wallet' : (budgetPlan === 'Shared' ? 'Select Shared Wallet' : 'Select Wallet')}</option>
                    {personalWalletsExist && (
                      <option value="Personal Wallets">Personal Wallets</option>
                    )}
                    {sharedWallets.map((wallet, index) => (
                      <option key={index} value={wallet.name}>
                        {wallet.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.wallet && <div className="error-text">{errors.wallet}</div>}
              </div>
            )}

            {!showWalletSelection && (budgetPlan === 'Shared' || isSharedBudget) && (
              <div className="budget-field">
                <div className="budget-label-with-icon">
                  <label>Selected Wallet</label>
                  <button
                    type="button"
                    className="budget-shared-icon"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowShareModal(true);
                    }}
                    title="Manage Collaborators"
                  >
                    <FaUsers />
                  </button>
                </div>
                <div className="budget-wallet-display">
                  {selectedWallet || (sharedWallets.length === 1 ? sharedWallets[0]?.name : 'Shared Wallet')}
                </div>
              </div>
            )}

            {budgetPlan === 'Personal' && !showWalletSelection && (
              <div className="budget-field">
                <label>Wallet Type</label>
                <div className="budget-wallet-display">
                  Personal Wallets
                </div>
              </div>
            )}

            {/* Budget Amount */}
            <div className="budget-field">
              <label>Budget Amount</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder={budgetAmount || !hasInteracted.amount ? '0' : ''}
                value={budgetAmount ? formatAmount(budgetAmount) : budgetAmount}
                onChange={(e) => { setErrors(prev => ({...prev, amount: ''})); handleAmountChange(e); }}
                onFocus={() => setHasInteracted(prev => ({ ...prev, amount: true }))}
                onBlur={() => {
                  if (!budgetAmount.trim()) {
                    setHasInteracted(prev => ({ ...prev, amount: false }));
                  }
                }}
                className={errors.amount ? 'input-error' : ''}
              />
              {errors.amount && <div className="error-text">{errors.amount}</div>}
            </div>

            {/* Category */}
            <div className="budget-field">
              <label>Category</label>
              <div className="budget-select">
                {category === 'Custom' ? (
                  <>
                    <input
                      type="text"
                      className={`budget-select-input ${errors.category ? 'input-error' : ''}`}
                      placeholder="Custom"
                      value={customCategory}
                      onChange={handleCustomCategoryChange}
                      onFocus={() => setHasInteracted(prev => ({ ...prev, category: true }))}
                      onBlur={handleCustomCategoryBlur}
                    />
                    <select
                      value={category}
                      onChange={(e) => { setErrors(prev => ({...prev, category: ''})); handleCategorySelect(e); }}
                      className="budget-select-hidden"
                    >
                      {BUDGET_CATEGORIES_BASE.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </>
                ) : (
                  <>
                    <div 
                      className={`budget-select-display ${errors.category ? 'input-error' : ''}`}
                      onClick={(e) => {
                        // Prevent re-opening when click originates from inside native select
                        const rawTarget = e.target as HTMLElement | null;
                        if (rawTarget && rawTarget.closest && rawTarget.closest('select')) return;

                          const parent = (e.currentTarget as HTMLElement).parentElement;
                          if (!parent) return;
                          // If Custom is selected, focus the input so the user can type
                          if (category === 'Custom') {
                            const input = parent.querySelector('input.budget-select-input') as HTMLInputElement | null;
                            if (input) input.focus();
                            return;
                          }
                          const select = parent.querySelector('select') as HTMLSelectElement | null;
                          if (select) triggerSelectDropdown(select);
                      }}
                    >
                      <span className={category ? '' : 'placeholder-text'}>
                        {category || 'Select category'}
                      </span>
                    </div>
                    <select
                      value={category}
                      onChange={(e) => { setErrors(prev => ({...prev, category: ''})); handleCategorySelect(e); }}
                      className="budget-select-hidden"
                    >
                      <option value="" disabled hidden>Select category</option>
                      {BUDGET_CATEGORIES_BASE.filter(c => c !== 'Custom').map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="Custom">Custom</option>
                    </select>
                  </>
                )}
                {errors.category && <div className="error-text">{errors.category}</div>}
                <button
                  type="button"
                  className="budget-select-arrow"
                  onClick={(e) => handleDropdownClick(e, 'category')}
                  aria-label="Change category"
                >
                  <FaChevronDown />
                </button>
              </div>
            </div>

            {/* Period */}
            <div className="budget-field">
              <label>Period</label>
              <div className="budget-select">
                <div 
                  className="budget-select-display"
                  onClick={(e) => {
                    const rawTarget = e.target as HTMLElement | null;
                    if (rawTarget && rawTarget.closest && rawTarget.closest('select')) return;
                    const parent = e.currentTarget.parentElement;
                    if (!parent) return;
                    const select = parent.querySelector('select') as HTMLSelectElement | null;
                    if (select) triggerSelectDropdown(select);
                  }}
                >
                  <span>{period}</span>
                </div>
                <select
                  value={period}
                  onChange={(e) => {
                    const newPeriod = e.target.value;
                    setPeriod(newPeriod);
                    // Recompute end date based on current start (custom or first of month)
                    const baseStart = customStartDate || firstOfMonth;
                    const newEnd = computeEndFromStart(newPeriod, baseStart);
                    setCustomEndDate(newEnd);
                    // Keep calendar focused on the start month
                    setCalendarMonth(baseStart.getMonth());
                    setCalendarYear(baseStart.getFullYear());
                  }}
                  className="budget-select-hidden"
                >
                  {BUDGET_PERIODS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="budget-select-arrow"
                  onClick={(e) => handleDropdownClick(e, 'period')}
                  aria-label="Change period"
                >
                  <FaChevronDown />
                </button>
              </div>
            </div>

            {/* Current Date Range */}
            <div className="budget-date-range">
              <div className="budget-date-range-header">
                <h3>Current Date Range</h3>
                <button 
                  type="button" 
                  className="budget-info-icon"
                  onClick={() => setShowInfoModal(true)}
                  aria-label="Date range information"
                >
                  <FaInfoCircle />
                </button>
              </div>
              <div className="budget-date-range-content">
                <div className="budget-date-card">
                  <p className="budget-date-text"><span className="budget-date-label">Budget Start:</span> {formatDate(startDate)}</p>
                  <p className="budget-date-text"><span className="budget-date-label">Budget End:</span> {formatDate(endDate)}</p>
                  <button 
                    type="button" 
                    className="budget-calendar-link"
                    onClick={() => setShowCalendar(!showCalendar)}
                  >
                    <FaCalendarAlt /> {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
                  </button>
                </div>
              </div>

              {/* Calendar Picker */}
              {showCalendar && (
                <div className="budget-calendar">
                  <div className="calendar-header">
                    <button
                      type="button"
                      className="calendar-nav-btn"
                      onClick={() => {
                        if (calendarMonth === 0) {
                          setCalendarMonth(11);
                          setCalendarYear(calendarYear - 1);
                        } else {
                          setCalendarMonth(calendarMonth - 1);
                        }
                      }}
                    >
                      <FaChevronLeft />
                    </button>
                    <h4>{new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h4>
                    <button
                      type="button"
                      className="calendar-nav-btn"
                      onClick={() => {
                        if (calendarMonth === 11) {
                          setCalendarMonth(0);
                          setCalendarYear(calendarYear + 1);
                        } else {
                          setCalendarMonth(calendarMonth + 1);
                        }
                      }}
                    >
                      <FaChevronDown className="calendar-nav-icon-right" />
                    </button>
                  </div>
                  <div className="calendar-weekdays">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                  </div>
                  <div className="calendar-grid">
                    {renderCalendar()}
                  </div>
                  <button
                    type="button"
                    className="calendar-done-btn"
                    onClick={() => setShowCalendar(false)}
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="budget-field">
              <label>Description</label>
              <input
                type="text"
                placeholder="Optional"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={() => setHasInteracted(prev => ({ ...prev, description: true }))}
                onBlur={() => {
                  if (!description.trim()) {
                    setHasInteracted(prev => ({ ...prev, description: false }));
                  }
                }}
              />
            </div>

            {/* Save Button */}
            <div className="budget-save-wrapper">
              <button className="budget-save-button" type="button" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>


      <CollaboratorModal
        isOpen={showShareModal && isSharedBudget}
        onClose={() => setShowShareModal(false)}
        title="Budget Collaborators"
        collaborators={collaborators}
        onAddCollaborator={handleAddCollaborator}
        onRemoveCollaborator={handleRemoveCollaborator}
        onRoleChange={handleRoleChange}
        variant="budget"
        ownerName={ownerNameToShow}
        ownerEmail={ownerEmailToShow}
        ownerUid={ownerUidToShow}
        searchQuery={searchQuery}
        searchResults={searchResults}
        onSearchChange={handleSearchUsers}
      />

      {showInfoModal && (
        <div className="budget-modal-overlay" onClick={() => setShowInfoModal(false)}>
          <div className="budget-modal" onClick={(e) => e.stopPropagation()}>
            <div className="budget-modal-header">
              <h2>Monthly Period</h2>
              <button type="button" className="budget-modal-close" onClick={() => setShowInfoModal(false)}>×</button>
            </div>
            <div className="budget-modal-content">
              <p>
                Monthly budgets always begin on the 1st day of the month and end on the last day of that month.
                We show the current month range so you can see which dates are included in this cutoff window.
              </p>
              <p>
                When you select a different period (Weekly or One-time), the end date will automatically update
                based on the start date shown above.
              </p>
              <h4>Example</h4>
              <ul className="budget-info-list">
                <li>Today is January 2, 2025.</li>
                <li>The current monthly range is January 1, 2025 – January 31, 2025.</li>
                <li>Since January 2 falls inside that range, it is part of the current budget period.</li>
              </ul>
              <p>
                Tip: If you want a different start date, open the calendar and choose a custom start — the end
                date will adjust automatically to match the selected period.
              </p>
            </div>
            <div className="budget-modal-footer">
              <button type="button" className="budget-modal-done-btn" onClick={() => setShowInfoModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

        {showDeleteModal && (
          <div className="wallet-modal-overlay" role="dialog" aria-modal="true">
            <div className="wallet-modal">
              <h3 className="wallet-modal-title">Delete Budget</h3>
              <p className="wallet-confirm-text">
                Are you sure you want to delete the budget "{existingBudget?.category || ''}"? This action cannot be undone.
              </p>
              <div className="wallet-confirm-actions">
                <button type="button" className="wallet-modal-btn secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button type="button" className="wallet-modal-btn" onClick={handleDeleteBudget}>Delete</button>
              </div>
            </div>
          </div>
        )}

      {showWalletChangeModal && (
        <div className="wallet-modal-overlay">
          <div className="wallet-modal">
            {(() => {
              const currentPlan = selectedWalletData?.plan || (selectedWallet === 'Personal Wallets' ? 'Personal' : undefined);
              const nextPlan = pendingWalletName === 'Personal Wallets'
                ? 'Personal'
                : (allWallets.find(w => w.name === pendingWalletName)?.plan || 'Personal');
              const title = nextPlan === 'Shared' && currentPlan === 'Personal' ? 'Convert to Shared Budget?' :
                            nextPlan === 'Personal' && currentPlan === 'Shared' ? 'Convert to Personal Budget?' :
                            'Change Selected Wallet?';
              const body = nextPlan === 'Shared' && currentPlan === 'Personal'
                ? "This will convert the budget to a shared budget tied to the selected shared wallet. Collaborators from that wallet will be applied."
                : nextPlan === 'Personal' && currentPlan === 'Shared'
                  ? "This will convert the budget to a personal budget linked to all personal wallets. Collaborators will be removed."
                  : "Changing the wallet will update the budget's collaborators to match the selected wallet.";
              return (
                <>
                  <h3>{title}</h3>
                  <p className="wallet-confirm-text">{body}</p>
                </>
              );
            })()}
            <div className="wallet-confirm-actions">
              <button type="button" className="wallet-modal-btn wallet-modal-btn-secondary" onClick={cancelWalletChange}>
                Cancel
              </button>
              <button type="button" className="wallet-modal-btn wallet-modal-btn-primary" onClick={confirmWalletChange}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
