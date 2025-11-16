import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronDown, FaUsers, FaInfoCircle, FaCalendarAlt, FaTimes } from 'react-icons/fa';
import type { Collaborator, Wallet } from '../utils/shared';
import { 
  getDaysInMonth, 
  calculateDateRange, 
  formatDate, 
  triggerSelectDropdown 
} from '../utils/shared';

// CONSTANTS

const BUDGET_CATEGORIES = [
  'Food',
  'Shopping',
  'Bills',
  'Car',
  'Income',
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
  
  const editMode = location.state?.editMode || false;
  const budgetIndex = location.state?.budgetIndex;
  const existingBudget = location.state?.budgetData;
  
  const savedWallets = sessionStorage.getItem('onboardingWallets');
  const availableWallets: Wallet[] = savedWallets ? JSON.parse(savedWallets) : [];
  
  const hasSharedWallet = availableWallets.some(w => w.plan === 'Shared');
  
  // State
  const [selectedWallet, setSelectedWallet] = useState<string>('');
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
  const [collaboratorInput, setCollaboratorInput] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());

  const isSharedBudget = selectedWalletData?.plan === 'Shared';

  const dateRange = customStartDate && customEndDate 
    ? { startDate: customStartDate, endDate: customEndDate }
    : calculateDateRange(period);
  const { startDate, endDate } = dateRange;

  useEffect(() => {
    if (!editMode && !hasSharedWallet && availableWallets.length > 0) {
      setSelectedWalletData({ plan: 'Personal' } as Wallet);
    }
  }, []);

  useEffect(() => {
    if (editMode && existingBudget) {
      setSelectedWallet(existingBudget.walletName || '');
      
      const wallet = availableWallets.find(w => w.name === existingBudget.walletName);
      if (wallet) {
        setSelectedWalletData(wallet);
      }
      
      setBudgetAmount(existingBudget.amount || '');
      setCategory(existingBudget.category || '');
      setCustomCategory(existingBudget.customCategory || '');
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
        if (!select) return;
        
        select.style.pointerEvents = 'auto';
        select.style.opacity = '1';
        select.style.zIndex = '1000';
        
        if ('showPicker' in HTMLSelectElement.prototype) {
          try {
            (select as any).showPicker();
          } catch (error) {
            select.focus();
            const clickEvent = new MouseEvent('mousedown', { bubbles: true });
            select.dispatchEvent(clickEvent);
          }
        } else {
          select.focus();
          const clickEvent = new MouseEvent('mousedown', { bubbles: true });
          select.dispatchEvent(clickEvent);
        }
        
        const hideSelect = () => {
          select.style.pointerEvents = 'none';
          select.style.opacity = '0';
          select.style.zIndex = '10';
        };
        
        select.addEventListener('blur', hideSelect, { once: true });
        select.addEventListener('change', hideSelect, { once: true });
      }, 50);
      return;
    }
    
    const parent = e.currentTarget.parentElement;
    if (!parent) return;
    const select = parent.querySelector('select') as HTMLSelectElement | null;
    if (!select) return;
    
    select.style.pointerEvents = 'auto';
    select.style.opacity = '1';
    select.style.zIndex = '1000';
    
    if ('showPicker' in HTMLSelectElement.prototype) {
      try {
        (select as any).showPicker();
      } catch (error) {
        select.focus();
        const clickEvent = new MouseEvent('mousedown', { bubbles: true });
        select.dispatchEvent(clickEvent);
      }
    } else {
      select.focus();
      const clickEvent = new MouseEvent('mousedown', { bubbles: true });
      select.dispatchEvent(clickEvent);
    }
    
    const hideSelect = () => {
      select.style.pointerEvents = 'none';
      select.style.opacity = '0';
      select.style.zIndex = '10';
    };
    
    select.addEventListener('blur', hideSelect, { once: true });
    select.addEventListener('change', hideSelect, { once: true });
  };

  const handleSave = () => {
    const budgetDataToPass = {
      walletName: selectedWallet,
      walletPlan: selectedWalletData?.plan || 'Personal',
      amount: budgetAmount,
      category: customCategory || category,
      customCategory: customCategory,
      period: period,
      description: description,
      startDate: customStartDate,
      endDate: customEndDate,
      collaborators: isSharedBudget ? collaborators : [],
      isShared: isSharedBudget
    };
    
    navigate('/onboarding', { 
      state: { 
        step: 'budget',
        budgetData: budgetDataToPass,
        budgetIndex: editMode ? budgetIndex : undefined
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddCollaborator();
    }
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

  return (
    <div className="budget-page">
      <div className="budget-container">
        <div className="budget-header">
          <button 
            className="budget-back" 
            type="button" 
            onClick={() => navigate('/onboarding', { state: { step: 'budget' } })}
          >
            <FaChevronLeft />
          </button>
          <h1 className="budget-title">Add Budget</h1>
        </div>

        <div className="budget-content">
          <div className="budget-form">
            {/* Wallet Selection */}
            {hasSharedWallet && (
              <div className="budget-field">
                <div className="budget-label-with-icon">
                  <label>Select Wallet</label>
                  {isSharedBudget && (
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
                  )}
                </div>
                <div className="budget-select">
                  <div 
                    className="budget-select-display"
                    onClick={(e) => {
                      const parent = e.currentTarget.parentElement;
                      if (!parent) return;
                      const select = parent.querySelector('select');
                      if (select) triggerSelectDropdown(select);
                    }}
                  >
                    <span>
                      {selectedWallet || 'Select Wallet'}
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
                      setSelectedWallet(walletName);
                      const wallet = availableWallets.find(w => w.name === walletName);
                      setSelectedWalletData(wallet || null);
                      if (wallet?.plan === 'Shared' && wallet.collaborators) {
                        setCollaborators(wallet.collaborators);
                      } else {
                        setCollaborators([]);
                      }
                    }}
                    className="budget-select-hidden"
                  >
                    <option value="">Select Wallet</option>
                    {availableWallets.map((wallet, index) => (
                      <option key={index} value={wallet.name}>
                        {wallet.name} ({wallet.plan})
                      </option>
                    ))}
                  </select>
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
                onChange={handleAmountChange}
                onFocus={() => setHasInteracted(prev => ({ ...prev, amount: true }))}
                onBlur={() => {
                  if (!budgetAmount.trim()) {
                    setHasInteracted(prev => ({ ...prev, amount: false }));
                  }
                }}
              />
            </div>

            {/* Category */}
            <div className="budget-field">
              <label>Category</label>
              <div className="budget-select">
                {category === 'Custom' ? (
                  <>
                    <input
                      type="text"
                      className="budget-select-input"
                      placeholder="Custom"
                      value={customCategory}
                      onChange={handleCustomCategoryChange}
                      onFocus={() => setHasInteracted(prev => ({ ...prev, category: true }))}
                      onBlur={handleCustomCategoryBlur}
                    />
                    <select
                      value={category}
                      onChange={handleCategorySelect}
                      className="budget-select-hidden"
                    >
                      {BUDGET_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </>
                ) : (
                  <>
                    <div 
                      className="budget-select-display"
                      onClick={(e) => e.preventDefault()}
                    >
                      <span className={category ? '' : 'placeholder-text'}>
                        {category || 'Select category'}
                      </span>
                    </div>
                    <select
                      value={category}
                      onChange={handleCategorySelect}
                      className="budget-select-hidden"
                    >
                      {BUDGET_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </>
                )}
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

      {/* Collaborator Modal */}
      {showShareModal && isSharedBudget && (
        <div className="budget-modal-overlay">
          <div className="budget-modal" onClick={(e) => e.stopPropagation()}>
            <div className="budget-modal-header">
              <h2>Manage Collaborators</h2>
              <button 
                type="button" 
                className="budget-modal-close"
                onClick={() => setShowShareModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="budget-modal-content">
              <p className="budget-modal-subtitle">
                Add people to share this budget with. Changes will reflect in both wallet and budget.
              </p>
              
              <div className="budget-collaborator-input-wrapper">
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
                  onClick={handleAddCollaborator}
                  className="budget-add-collaborator-btn"
                  disabled={!collaboratorInput.trim()}
                >
                  Add
                </button>
              </div>

              <div className="budget-collaborators-list-modal">
                <div className="budget-collaborator-item-modal owner">
                  <div className="budget-collaborator-info-modal">
                    <span className="budget-collaborator-name-modal">You (Owner)</span>
                    <span className="budget-collaborator-email-modal">Current User</span>
                  </div>
                  <span className="budget-collaborator-role-modal">Owner</span>
                </div>

                {collaborators.map((collaborator: Collaborator) => (
                  <div key={collaborator.id} className="budget-collaborator-item-modal">
                    <div className="budget-collaborator-info-modal">
                      <span className="budget-collaborator-name-modal">{collaborator.name}</span>
                      <span className="budget-collaborator-email-modal">{collaborator.email}</span>
                    </div>
                    <div className="budget-collaborator-actions">
                      <select
                        value={collaborator.role}
                        onChange={(e) => handleRoleChange(collaborator.id, e.target.value)}
                        className="budget-role-select"
                      >
                        <option value="Editor">Editor</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveCollaborator(collaborator.id)}
                        className="budget-remove-btn"
                        title="Remove collaborator"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="budget-modal-done-btn"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
