import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronDown, FaUsers, FaInfoCircle, FaCalendarAlt } from 'react-icons/fa';
import type { Collaborator, Wallet } from '../utils/shared';
import {
  getDaysInMonth,
  calculateDateRange,
  formatDate,
  triggerSelectDropdown,
  formatAmount,
  CURRENCY_SYMBOLS
} from '../utils/shared';
import { useAppState } from '../state/AppStateContext';
import CollaboratorModal from './CollaboratorModal';

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

  const getWallets = () => {
    if (returnTo === '/dashboard' || returnTo === '/personal' || returnTo === '/shared') {
      const stored = sessionStorage.getItem('wallets');
      return stored ? JSON.parse(stored) : [];
    }
    const onboardingWallets = sessionStorage.getItem('onboardingWallets');
    return onboardingWallets ? JSON.parse(onboardingWallets) : [];
  };
  
  const allWallets: Wallet[] = getWallets();
  
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
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showWalletChangeModal, setShowWalletChangeModal] = useState<boolean>(false);
  const [pendingWalletName, setPendingWalletName] = useState<string>('');

  const currency = localStorage.getItem('selectedCurrency') || 'PHP';
  const currencySymbol = CURRENCY_SYMBOLS[currency] || '₱';

  const isSharedBudget = (selectedWalletData?.plan || budgetPlan) === 'Shared';

  const dateRange = customStartDate && customEndDate 
    ? { startDate: customStartDate, endDate: customEndDate }
    : calculateDateRange(period);
  const { startDate, endDate } = dateRange;
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
        if (!allWallets.some(w => w.plan === 'Shared') && personalWalletsExist) {
          setSelectedWallet('Personal Wallets');
          setSelectedWalletData({ plan: 'Personal' } as Wallet);
        }
      }
    }
  }, []);

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
    let value = e.target.value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    if (parts[1] && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    setBudgetAmount(value);
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

  const handleSave = () => {
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
        const raw = sessionStorage.getItem('customCategories');
        const list = raw ? JSON.parse(raw) : [];
        if (!list.includes(customCategory)) {
          list.push(customCategory);
          sessionStorage.setItem('customCategories', JSON.stringify(list));
        }
      } catch {}
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

    const budgetDataToPass = {
      id: editMode && existingBudget?.id ? existingBudget.id : Date.now().toString(),
      wallet: resolvedWalletName,
      plan: planForBudget,
      amount: budgetAmount,
      category: chosenCategory,
      period: period,
      description: description,
      startDate: customStartDate,
      endDate: customEndDate,
      left: nextLeft,
      collaborators: planForBudget === 'Shared' ? collaborators : []
    };
    
    if (returnTo === '/dashboard' || returnTo === '/personal' || returnTo === '/shared') {
      const existingBudgets = sessionStorage.getItem('budgets');
      let budgets = existingBudgets ? JSON.parse(existingBudgets) : [];
      
      if (editMode) {
        if (budgetIndex !== undefined) {
          budgets[budgetIndex] = budgetDataToPass;
        } else {
          const idx = budgets.findIndex((b: any) => b.id === budgetDataToPass.id);
          if (idx >= 0) budgets[idx] = budgetDataToPass; else budgets.push(budgetDataToPass);
        }
      } else {
        budgets.push(budgetDataToPass);
      }
      
      sessionStorage.setItem('budgets', JSON.stringify(budgets));
      try { window.dispatchEvent(new CustomEvent('data-updated', { detail: { source: 'budget-save' } })); } catch {}

      if (budgetDataToPass.plan === 'Shared') {
        const walletIdForLog = selectedWalletData?.id || budgetDataToPass.wallet || 'shared-wallet';
        const amountLabel = `${currencySymbol} ${formatAmount(budgetDataToPass.amount || '0')}`;
        logActivity({
          walletId: walletIdForLog,
          action: editMode ? 'budget_updated' : 'budget_added',
          entityType: 'budget',
          entityId: budgetDataToPass.id,
          message: `${currentUser.name} ${editMode ? 'updated' : 'created'} the ${budgetDataToPass.category} budget (${amountLabel})`
        });
      }

      if (budgetDataToPass.plan === 'Shared' && resolvedWalletName) {
        try {
          const rawWallets = sessionStorage.getItem('wallets');
          if (rawWallets) {
            const wallets = JSON.parse(rawWallets);
            const updatedWallets = wallets.map((w: any) => {
              if (w.name === resolvedWalletName && w.plan === 'Shared') {
                return { ...w, collaborators };
              }
              return w;
            });
            sessionStorage.setItem('wallets', JSON.stringify(updatedWallets));
          }
          const syncBudgetsRaw = sessionStorage.getItem('budgets');
          if (syncBudgetsRaw) {
            const all = JSON.parse(syncBudgetsRaw);
            const updated = all.map((b: any) => {
              if (b.plan === 'Shared' && b.wallet === resolvedWalletName) {
                return { ...b, collaborators };
              }
              return b;
            });
            sessionStorage.setItem('budgets', JSON.stringify(updated));
          }
        } catch {}
      }
      navigate(returnTo);
    } else {
      if (budgetDataToPass.plan === 'Shared' && !returnTo.startsWith('/onboarding')) {
        const walletIdForLog = selectedWalletData?.id || budgetDataToPass.wallet || 'shared-wallet';
        const amountLabel = `${currencySymbol} ${formatAmount(budgetDataToPass.amount || '0')}`;
        logActivity({
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
                placeholder={budgetAmount || !hasInteracted.amount ? '0.00' : ''}
                value={budgetAmount}
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
                      {(() => {
                        let extras: string[] = [];
                        try { const raw = sessionStorage.getItem('customCategories'); extras = raw ? JSON.parse(raw) : []; } catch {}
                        const merged = [...new Set([...BUDGET_CATEGORIES_BASE, ...extras])];
                        return merged.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ));
                      })()}
                    </select>
                  </>
                ) : (
                  <>
                    <div 
                      className={`budget-select-display ${errors.category ? 'input-error' : ''}`}
                      onClick={(e) => e.preventDefault()}
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
                      {(() => {
                        let extras: string[] = [];
                        try { const raw = sessionStorage.getItem('customCategories'); extras = raw ? JSON.parse(raw) : []; } catch {}
                        const merged = [...new Set([...BUDGET_CATEGORIES_BASE, ...extras])];
                        return merged.filter(c => c !== 'Custom').map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ));
                      })()}
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
                  onClick={(e) => e.preventDefault()}
                >
                  <span>{period}</span>
                </div>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
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
                  title="Date range is calculated based on selected period"
                >
                  <FaInfoCircle />
                </button>
              </div>
              <div className="budget-date-range-content">
                <p className="budget-date-text">Budget Start: {formatDate(startDate)}</p>
                <p className="budget-date-text">Budget End: {formatDate(endDate)}</p>
                <button 
                  type="button" 
                  className="budget-calendar-link"
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <FaCalendarAlt /> {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
                </button>
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
      />

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
