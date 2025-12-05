import { WALLET_TEMPLATES } from '../components/AddWallet';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { CURRENCY_SYMBOLS, formatAmount, formatAmountNoTrailing, CHART_COLORS, validateAndFormatAmount, canEditWallet, isOwner } from '../../utils/shared';
import type { Collaborator } from '../../utils/shared';
import { FaPlus, FaPen, FaUsers, FaRegCommentDots } from 'react-icons/fa';
// Inlined AddTransaction component from AddTransaction.tsx
import { useEffect as useEffectAddTx, useMemo as useMemoAddTx, useState as useStateAddTx } from 'react';
import { triggerSelectDropdown as triggerSelectDropdownAddTx } from '../../utils/shared';
import { FaChevronDown as FaChevronDownAddTx } from 'react-icons/fa';
import { FiTrash2 as FiTrashAddTx } from 'react-icons/fi';
import * as walletServiceAddTx from '../../services/walletService';
import * as budgetServiceAddTx from '../../services/budgetService';
import * as transactionServiceAddTx from '../../services/transactionService';
import * as customCategoryServiceAddTx from '../../services/customCategoryService';

export type AddTransactionType = {
  id: string;
  type: 'Income' | 'Expense' | 'Transfer';
  amount: string;
  dateISO: string;
  category: string;
  walletFrom: string;
  walletTo?: string;
  description?: string;
  createdById?: string;
  createdByName?: string;
  createdByUsername?: string;
  createdAtISO?: string;
  updatedById?: string;
  updatedByName?: string;
  updatedByUsername?: string;
  updatedAtISO?: string;
};

interface AddTransactionWallet { name: string; plan: 'Personal' | 'Shared'; balance: string; }
interface AddTransactionBudget { id: string; category: string; amount: string; left?: string; plan?: 'Personal' | 'Shared'; wallet?: string; }

interface AddTransactionProps {
  isOpen: boolean;
  onClose: () => void;
  defaultWallet?: string;
  editTx?: AddTransactionType | null;
  onDeleted?: (tx: AddTransactionType) => void;
  onSaved?: (tx: AddTransactionType) => void;
}

const TRANSACTION_BASE_CATEGORIES = ['Food','Shopping','Bills','Car','Custom'] as const;

function AddTransaction({ isOpen, onClose, defaultWallet, editTx, onDeleted, onSaved }: AddTransactionProps) {
  const { currentUser } = useAppState();
  const [type, setType] = useStateAddTx<'Income' | 'Expense' | 'Transfer'>('Expense');
  const [amount, setAmount] = useStateAddTx<string>('');
  const [dateISO, setDateISO] = useStateAddTx<string>('');
  const [category, setCategory] = useStateAddTx<string>('');
  const [customCategory, setCustomCategory] = useStateAddTx<string>('');
  const [walletFrom, setWalletFrom] = useStateAddTx<string>(defaultWallet || '');
  const [walletTo, setWalletTo] = useStateAddTx<string>('');
  const [description, setDescription] = useStateAddTx<string>('');
  const [errors, setErrors] = useStateAddTx<Record<string, string>>({});
  const [wallets, setWallets] = useStateAddTx<AddTransactionWallet[]>([]);
  const [budgets, setBudgets] = useStateAddTx<AddTransactionBudget[]>([]);
  const activeWallet = useMemoAddTx(() => wallets.find(w => w.name === walletFrom), [walletFrom, wallets]);
  const isSharedWallet = activeWallet?.plan === 'Shared';
  const formatAuditStamp = (iso?: string) => {
    if (!iso) return 'Not recorded';
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };
  useEffectAddTx(() => {
    if (isOpen) {
      const loadData = async () => {
        try {
          const [walletsData, budgetsData] = await Promise.all([
            walletServiceAddTx.getWallets().catch(() => []),
            budgetServiceAddTx.getBudgets().catch(() => [])
          ]);
          setWallets(walletsData.map(w => ({
            name: w.name,
            plan: w.plan,
            balance: w.balance
          })));
          setBudgets(budgetsData.map(b => ({
            id: String(b.id || b._id || ''),
            category: b.category,
            amount: b.amount,
            left: b.left,
            plan: b.plan,
            wallet: b.wallet
          })));
        } catch (err) {
          console.error('Failed to load data:', err);
          setWallets([]);
          setBudgets([]);
        }
      };
      loadData();
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const v = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
      if (!editTx) {
        setType('Expense');
        setAmount('');
        setDateISO(v);
        setCategory('');
        setCustomCategory('');
        setDescription('');
        setWalletTo('');
        setErrors({});
        if (defaultWallet) setWalletFrom(defaultWallet); else setWalletFrom('');
      }
      if (editTx) {
        // If editing a Transfer in shared wallet, change it to Expense (Transfer not allowed in shared wallets)
        const editType = editTx.type === 'Transfer' && isSharedWallet ? 'Expense' : editTx.type;
        setType(editType);
        setAmount(editTx.amount);
        try { setDateISO(new Date(editTx.dateISO).toISOString().slice(0,16)); } catch { setDateISO(v); }
        setCategory(editTx.category || '');
        setWalletFrom(editTx.walletFrom);
        // Clear walletTo if it was a Transfer in shared wallet
        setWalletTo(editTx.type === 'Transfer' && isSharedWallet ? '' : (editTx.walletTo || ''));
        setDescription(editTx.description || '');
      }
    } else {
      setErrors({});
      setCustomCategory('');
    }
  }, [isOpen, defaultWallet, editTx]);
  const handleDropdownClick = (e: React.MouseEvent<HTMLButtonElement>, selectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (category === 'Custom' && selectId === 'category') {
      setCategory('');
      setCustomCategory('');
      setTimeout(() => {
        const parent = e.currentTarget.parentElement;
        if (!parent) return;
        const select = parent.querySelector('select') as HTMLSelectElement | null;
        if (select) triggerSelectDropdownAddTx(select);
      }, 50);
      return;
    }
    const parent = e.currentTarget.parentElement;
    if (!parent) return;
    const select = parent.querySelector('select') as HTMLSelectElement | null;
    if (select) triggerSelectDropdownAddTx(select);
  };

  const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    // removed: setHasInteractedCategory
    if (value === 'Custom') {
      setCategory('Custom');
      setCustomCategory('');
    } else {
      setCategory(value);
      setCustomCategory('');
    }
  };

  const handleCustomCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomCategory(e.target.value);
    // removed: setHasInteractedCategory
  };

  const handleCustomCategoryBlur = () => {
    if (!customCategory.trim()) {
      // removed: setHasInteractedCategory
    }
  };
  const allWallets = useMemoAddTx(() => wallets, [wallets]);
  const [mergedCategories, setMergedCategories] = useStateAddTx<string[]>([]);
  useEffectAddTx(() => {
    const loadCategories = async () => {
      const extrasFromBudgets: string[] = [];
      if (activeWallet) {
        if (activeWallet.plan === 'Shared') {
          budgets.filter(b => b.plan === 'Shared' && b.wallet === activeWallet.name)
            .forEach(b => { const c = b.category; if (c && !extrasFromBudgets.includes(c)) extrasFromBudgets.push(c); });
        } else {
          // Personal wallet: include personal budgets
          budgets.filter(b => (b.plan || 'Personal') === 'Personal')
            .forEach(b => { const c = b.category; if (c && !extrasFromBudgets.includes(c)) extrasFromBudgets.push(c); });
        }
      } else {
        budgets.forEach(b => { const c = b.category; if (c && !extrasFromBudgets.includes(c)) extrasFromBudgets.push(c); });
      }
      const baseNoCustom = TRANSACTION_BASE_CATEGORIES.filter(c => c !== 'Custom');
      const orderedUnique = [...new Set([...baseNoCustom, ...extrasFromBudgets])];
      setMergedCategories(orderedUnique);
    };
    loadCategories();
  }, [budgets, activeWallet]);
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!type) errs.type = 'Select a type.';
    // Prevent Transfer in shared wallets
    if (type === 'Transfer' && isSharedWallet) {
      errs.type = 'Transfer is not allowed in shared wallets.';
    }
    const amt = parseFloat(amount || '0') || 0;
    if (amt <= 0) errs.amount = 'Enter a valid amount.';
    if (!dateISO) errs.date = 'Select a date.';
    if (!walletFrom) errs.walletFrom = 'Select a wallet.';
    if (type === 'Transfer' && !isSharedWallet && !walletTo) errs.walletTo = 'Select destination wallet.';
    if (type === 'Expense' && !(category || customCategory)) errs.category = 'Select a category.';
    if (type === 'Income' && !(category || customCategory)) errs.category = 'Select a category.';

    // Overspending checks
    if (type === 'Expense' && amt > 0 && walletFrom) {
      const wallet = wallets.find(w => w.name === walletFrom);
      if (wallet) {
        let effectiveBalance = parseFloat(wallet.balance);
        // If editing, add back the original transaction amount to get effective balance
        if (editTx && editTx.id && editTx.type === 'Expense') {
          const originalAmount = parseFloat(editTx.amount || '0');
          effectiveBalance += originalAmount;
        }
        if (amt > effectiveBalance) {
          errs.amount = 'Amount exceeds wallet balance.';
        }
      }
      // Check budget
      const chosenCategory = customCategory || category;
      const budget = budgets.find(b => {
        const isMatch = String(b.category).toLowerCase() === chosenCategory.toLowerCase();
        const isPersonal = (b.plan || 'Personal') === 'Personal';
        const isSharedMatch = b.plan === 'Shared' && b.wallet === walletFrom;
        return isMatch && (isPersonal || isSharedMatch);
      });
      if (budget) {
        let effectiveLeft = parseFloat(budget.left ?? budget.amount ?? '0') || 0;
        // If editing an expense with the same category, add back the original amount
        if (editTx && editTx.id && editTx.type === 'Expense') {
          // Get the original category (custom categories are stored directly in category field)
          const originalCategory = (editTx.category || '').toLowerCase();
          const currentCategory = chosenCategory.toLowerCase();
          // If categories match, add back the original amount to budget
          if (originalCategory === currentCategory) {
            const originalAmount = parseFloat(editTx.amount || '0');
            effectiveLeft += originalAmount;
          }
        }
        if (amt > effectiveLeft) {
          errs.amount = 'Amount exceeds budget limit.';
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const revertOriginalIfEditing = async (original: AddTransactionType) => {
    const amt = parseFloat(original.amount || '0') || 0;
    try {
      const walletsData = await walletServiceAddTx.getWallets();
      const budgetsData = await budgetServiceAddTx.getBudgets();
      if (original.type === 'Income') {
        const wallet = walletsData.find(w => w.name === original.walletFrom);
        if (wallet) {
          const newBalance = (parseFloat(wallet.balance) - amt).toFixed(2);
          await walletServiceAddTx.updateWallet(wallet.id || wallet._id || '', { balance: newBalance });
        }
      } else if (original.type === 'Expense') {
        const wallet = walletsData.find(w => w.name === original.walletFrom);
        if (wallet) {
          const newBalance = (parseFloat(wallet.balance) + amt).toFixed(2);
          await walletServiceAddTx.updateWallet(wallet.id || wallet._id || '', { balance: newBalance });
        }
        for (const b of budgetsData) {
          const isMatch = String(b.category).toLowerCase() === String(original.category).toLowerCase();
          const isPersonal = (b.plan || 'Personal') === 'Personal';
          const isSharedMatch = b.plan === 'Shared' && b.wallet === original.walletFrom;
          if (isMatch && (isPersonal || isSharedMatch)) {
            const leftNum = parseFloat(b.left ?? b.amount ?? '0') || 0;
            const newLeft = (leftNum + amt).toFixed(2);
            await budgetServiceAddTx.updateBudget(b.id || b._id || '', { left: newLeft });
          }
        }
      } else if (original.type === 'Transfer') {
        const walletFrom = walletsData.find(w => w.name === original.walletFrom);
        if (walletFrom) {
          const newBalance = (parseFloat(walletFrom.balance) + amt).toFixed(2);
          await walletServiceAddTx.updateWallet(walletFrom.id || walletFrom._id || '', { balance: newBalance });
        }
        if (original.walletTo) {
          const walletTo = walletsData.find(w => w.name === original.walletTo);
          if (walletTo) {
            const newBalance = (parseFloat(walletTo.balance) - amt).toFixed(2);
            await walletServiceAddTx.updateWallet(walletTo.id || walletTo._id || '', { balance: newBalance });
          }
        }
      }
    } catch (err) {
      console.error('Failed to revert transaction:', err);
    }
  };
  const handleSave = async () => {
    if (!validate()) return;
    // No modal block needed
    const amt = parseFloat(amount);
    if (editTx && editTx.id) {
      await revertOriginalIfEditing(editTx);
    }
    const chosenCategory = customCategory || category;
    try {
      const walletsData = await walletServiceAddTx.getWallets();
      const budgetsData = await budgetServiceAddTx.getBudgets();
      if (type === 'Income') {
        const wallet = walletsData.find(w => w.name === walletFrom);
        if (wallet) {
          const newBalance = (parseFloat(wallet.balance) + amt).toFixed(2);
          await walletServiceAddTx.updateWallet(wallet.id || wallet._id || '', { balance: newBalance });
        }
      } else if (type === 'Expense') {
        const wallet = walletsData.find(w => w.name === walletFrom);
        if (wallet) {
          const newBalance = (parseFloat(wallet.balance) - amt).toFixed(2);
          await walletServiceAddTx.updateWallet(wallet.id || wallet._id || '', { balance: newBalance });
        }
        for (const b of budgetsData) {
          const isMatch = String(b.category).toLowerCase() === chosenCategory.toLowerCase();
          const isPersonal = (b.plan || 'Personal') === 'Personal';
          const isSharedMatch = b.plan === 'Shared' && b.wallet === walletFrom;
          if (isMatch && (isPersonal || isSharedMatch)) {
            const leftNum = parseFloat(b.left ?? b.amount ?? '0') || 0;
            const nextLeft = Math.max(leftNum - amt, 0).toFixed(2);
            await budgetServiceAddTx.updateBudget(b.id || b._id || '', { left: nextLeft });
          }
        }
      } else if (type === 'Transfer' && !isSharedWallet) {
        // Transfer only allowed in personal wallets
        const walletFromData = walletsData.find(w => w.name === walletFrom);
        if (walletFromData) {
          const newBalance = (parseFloat(walletFromData.balance) - amt).toFixed(2);
          await walletServiceAddTx.updateWallet(walletFromData.id || walletFromData._id || '', { balance: newBalance });
        }
        if (walletTo) {
          const walletToData = walletsData.find(w => w.name === walletTo);
          if (walletToData) {
            const newBalance = (parseFloat(walletToData.balance) + amt).toFixed(2);
            await walletServiceAddTx.updateWallet(walletToData.id || walletToData._id || '', { balance: newBalance });
          }
        }
      }
    } catch (err) {
      console.error('Failed to update wallets/budgets:', err);
    }
    if (customCategory && !mergedCategories.includes(customCategory)) {
      try {
        await customCategoryServiceAddTx.createCustomCategory(customCategory);
      } catch (err) {
        console.error('Failed to save custom category:', err);
      }
    }
    const nowIso = new Date().toISOString();
    const actorId = currentUser.id;
    const actorName = currentUser.name;
    const txData = {
      type,
      amount: amt.toFixed(2),
      dateISO: new Date(dateISO).toISOString(),
      category: chosenCategory,
      walletFrom,
      walletTo: type === 'Transfer' && !isSharedWallet ? walletTo : undefined,
      description,
      createdById: editTx?.createdById || actorId,
      createdByName: editTx?.createdByName || actorName,
      createdAtISO: editTx?.createdAtISO || editTx?.dateISO || nowIso,
      updatedById: actorId,
      updatedByName: actorName,
      updatedAtISO: nowIso
    };
    try {
      let savedTx;
      if (editTx && editTx.id) {
        savedTx = await transactionServiceAddTx.updateTransaction(editTx.id, txData);
      } else {
        savedTx = await transactionServiceAddTx.createTransaction(txData);
      }
      try { window.dispatchEvent(new CustomEvent('data-updated', { detail: { source: 'transaction-save' } })); } catch {}
      if (onSaved) onSaved({
        ...savedTx,
        id: String(savedTx.id || savedTx._id || ''),
        dateISO: typeof savedTx.dateISO === 'string' ? savedTx.dateISO : savedTx.dateISO?.toISOString?.() || '',
        createdAtISO: typeof savedTx.createdAtISO === 'string' ? savedTx.createdAtISO : savedTx.createdAtISO?.toISOString?.() || '',
        updatedAtISO: typeof savedTx.updatedAtISO === 'string' ? savedTx.updatedAtISO : savedTx.updatedAtISO?.toISOString?.() || '',
      });
      onClose();
    } catch (err) {
      console.error('Failed to save transaction:', err);
      alert('Failed to save transaction. Please try again.');
    }
  };
  const handleDelete = async () => {
    if (!editTx || !editTx.id) return;
    try {
      await revertOriginalIfEditing(editTx);
      await transactionServiceAddTx.deleteTransaction(editTx.id);
      try { window.dispatchEvent(new CustomEvent('data-updated', { detail: { source: 'transaction-delete' } })); } catch {}
      onClose();
      if (onDeleted) onDeleted({ ...editTx, id: String(editTx.id || '') });
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      alert('Failed to delete transaction. Please try again.');
    }
  };
  if (!isOpen) return null;
  return (
    <>
    <div className="tx-modal-overlay" role="dialog" aria-modal="true">
      <div className="tx-modal">
        <div className="tx-modal-header">
          <h3>{editTx ? 'Edit Transaction' : 'Add Transaction'}</h3>
          {editTx && (
            <button type="button" className="tx-btn tx-btn-danger tx-btn-header" onClick={handleDelete} title="Delete transaction" aria-label="Delete transaction">
              <FiTrashAddTx />
            </button>
          )}
        </div>
        <div className="tx-modal-body">
          {isSharedWallet && editTx && (
            <div className="tx-audit">
              <div className="tx-audit-row">
                <span className="tx-audit-label">Created by</span>
                <span className="tx-audit-value">{editTx.createdByUsername || editTx.createdByName || 'Not recorded'} | {formatAuditStamp(editTx.createdAtISO || editTx.dateISO)}</span>
              </div>
              <div className="tx-audit-row">
                <span className="tx-audit-label">Last updated by</span>
                <span className="tx-audit-value">{editTx.updatedByUsername || editTx.createdByUsername || editTx.updatedByName || editTx.createdByName || 'Not recorded'} | {formatAuditStamp(editTx.updatedAtISO || editTx.createdAtISO || editTx.dateISO)}</span>
              </div>
            </div>
          )}
          <div className="tx-field">
            <label>Type</label>
            <div className="tx-select">
              <div className={`tx-select-display ${errors.type ? 'input-error' : ''}`} onClick={(e) => e.preventDefault()}>
                <span>{type}</span>
              </div>
              <select 
                value={type} 
                onChange={(e) => {
                  const newType = e.target.value as 'Income' | 'Expense' | 'Transfer';
                  // Prevent Transfer in shared wallets
                  if (newType === 'Transfer' && isSharedWallet) {
                    return; // Don't allow Transfer selection
                  }
                  setType(newType);
                  // Clear walletTo if changing away from Transfer
                  if (newType !== 'Transfer') {
                    setWalletTo('');
                  }
                }} 
                className="tx-hidden-select"
              >
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
                {!isSharedWallet && <option value="Transfer">Transfer</option>}
              </select>
              <button type="button" className="tx-select-arrow" onClick={(e) => handleDropdownClick(e, 'type')} aria-label="Change type">
                <FaChevronDownAddTx />
              </button>
            </div>
            {errors.type && <div className="error-text">{errors.type}</div>}
          </div>

          <div className="tx-field">
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
                    onBlur={handleCustomCategoryBlur}
                  />
                  <select
                    value={category}
                    onChange={handleCategorySelect}
                    className="budget-select-hidden"
                  >
                    {mergedCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="Custom">Custom</option>
                  </select>
                </>
              ) : (
                <>
                  <div 
                    className={`budget-select-display ${errors.category ? 'input-error' : ''}`}
                    onClick={(e) => {
                      const rawTarget = e.target as HTMLElement | null;
                      if (rawTarget && rawTarget.closest && rawTarget.closest('select')) return;
                      const parent = (e.currentTarget as HTMLElement).parentElement;
                      if (!parent) return;
                      if (category === 'Custom') {
                        const input = parent.querySelector('input.budget-select-input') as HTMLInputElement | null;
                        if (input) input.focus();
                        return;
                      }
                      const select = parent.querySelector('select') as HTMLSelectElement | null;
                      if (select) triggerSelectDropdownAddTx(select);
                    }}
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
                    <option value="" disabled hidden>Select category</option>
                    {mergedCategories.map(cat => (
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
                <FaChevronDownAddTx />
              </button>
            </div>
          </div>

          <div className="tx-field">
            <label>Amount</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={amount ? formatAmount(amount) : amount}
              onChange={(e) => {
                const cleaned = validateAndFormatAmount(e.target.value);
                setAmount(cleaned);
              }}
            />
            {errors.amount && <div className="error-text">{errors.amount}</div>}
          </div>

          <div className="tx-field">
            <label>Date</label>
            <input type="datetime-local" className="tx-datetime" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
            {errors.date && <div className="error-text">{errors.date}</div>}
          </div>

          <div className="tx-field">
            <label>Wallet</label>
            <div className="tx-select">
              <div className={`tx-select-display ${errors.walletFrom ? 'input-error' : ''}`} onClick={(e) => e.preventDefault()}>
                <span className={walletFrom ? '' : 'placeholder-text'}>
                  {walletFrom || 'Select wallet'}
                </span>
              </div>
                <select value={walletFrom} onChange={(e) => setWalletFrom(e.target.value)} className="tx-hidden-select">
                <option value="" disabled hidden>Select wallet</option>
                {allWallets.map((w) => (
                  <option key={w.name} value={w.name}>{w.name}</option>
                ))}
              </select>
              <button type="button" className="tx-select-arrow" onClick={(e) => handleDropdownClick(e, 'walletFrom')} aria-label="Change wallet">
                <FaChevronDownAddTx />
              </button>
            </div>
            {errors.walletFrom && <div className="error-text">{errors.walletFrom}</div>}
          </div>

          {type === 'Transfer' && !isSharedWallet && (
            <div className="tx-field">
              <label>Destination Wallet</label>
              <div className="tx-select">
                <div className="tx-select-display" onClick={(e) => e.preventDefault()}>
                  <span className={walletTo ? '' : 'placeholder-text'}>
                    {walletTo || 'Select destination'}
                  </span>
                </div>
                <select value={walletTo} onChange={(e) => setWalletTo(e.target.value)} className="tx-hidden-select">
                  <option value="" disabled hidden>Select destination</option>
                  {allWallets.filter(w => w.name !== walletFrom).map((w) => (
                    <option key={w.name} value={w.name}>{w.name}</option>
                  ))}
                </select>
                <button type="button" className="tx-select-arrow" onClick={(e) => handleDropdownClick(e, 'walletTo')} aria-label="Change destination">
                  <FaChevronDownAddTx />
                </button>
              </div>
              {errors.walletTo && <div className="error-text">{errors.walletTo}</div>}
            </div>
          )}

          <div className="tx-field">
            <label>Description</label>
            <input type="text" placeholder="Optional" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <div className="tx-modal-footer">
          <div className="tx-footer-left">
            <button type="button" className="tx-btn tx-btn-ghost" onClick={onClose} aria-label="Cancel">Cancel</button>
          </div>
          <div className="tx-footer-right">
            <button
              type="button"
              className="tx-btn"
              onClick={handleSave}
              disabled={
                !amount ||
                parseFloat(amount) <= 0 ||
                (!(customCategory || category)) ||
                (category === 'Custom' && !customCategory)
              }
            >
              {editTx ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

// ActivityLogPanel removed
const formatTimestamp = (iso: string) => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};
// ActivityLogPanel component removed

// Inlined CollaboratorChat component from CollaboratorChat.tsx
import { useMemo as useMemoChat, useState as useStateChat } from 'react';
import { useComments } from '../../state/AppStateContext';
function CollaboratorChat({ walletId, walletName, showHeader = true }: { walletId?: string; walletName?: string; showHeader?: boolean }) {
  const { addComment, currentUser } = useAppState();
  const [message, setMessage] = useStateChat('');
  const chatEntries = useComments(walletId, walletId);
  const sortedMessages = useMemoChat(
    () => chatEntries.slice().sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1)),
    [chatEntries]
  );
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!walletId) return;
    const trimmed = message.trim();
    if (!trimmed) return;
    addComment({ walletId, entityId: walletId, message: trimmed });
    setMessage('');
  };
  if (!walletId) {
    return (
      <div className="shared-chat-empty">
        <p>Select a shared wallet to chat with the group.</p>
      </div>
    );
  }
  return (
    <div className="shared-chat-panel">
      {showHeader && (
        <div className="shared-chat-header">
          <h3 className="shared-box-title">Group Chat</h3>
          <p className="shared-chat-subheading">Coordinate with everyone on {walletName}</p>
        </div>
      )}
      {!walletId ? (
        <div className="shared-chat-empty">
          <p>Select a shared wallet to chat with the group.</p>
        </div>
      ) : (
        <>
          <div className="shared-chat-list" role="log" aria-live="polite">
            {sortedMessages.length === 0 ? (
              <div className="shared-list-empty">Start the conversation with your group.</div>
            ) : (
              sortedMessages.map((comment) => (
                <div key={comment.id} className="shared-chat-item">
                  <div className="shared-chat-avatar" aria-hidden="true">
                    {comment.authorName
                      .split(' ')
                      .map((part) => part.charAt(0).toUpperCase())
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div className="shared-chat-body">
                    <div className="shared-chat-meta">
                      <span>{comment.authorName}</span>
                      <span>•</span>
                      <span>{formatTimestamp(comment.createdAt)}</span>
                    </div>
                    <p className="shared-chat-message">{comment.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <form className="shared-chat-form" onSubmit={handleSubmit}>
            <label htmlFor="collab-message" className="sr-only">Message</label>
            <textarea
              id="collab-message"
              className="shared-chat-input"
              placeholder={`Send a message as ${currentUser.name}`}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
            />
            <button type="submit" className="shared-chat-submit" disabled={!message.trim()}>
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
}
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
            <div className="wallet-modal-input-row">
              <input
                type="text"
                className="wallet-modal-input"
                placeholder="Add collaborators (email or username)"
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
                    if (onSearchChange && searchQuery) {
                      onAddCollaborator(searchQuery);
                      if (onSearchChange) onSearchChange('');
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
import { useAppState } from '../../state/AppStateContext';
import * as walletService from '../../services/walletService';
import * as budgetService from '../../services/budgetService';
import * as transactionService from '../../services/transactionService';
import * as userService from '../../services/userService';
import { useCurrency } from '../../hooks/useCurrency';
import type { Transaction } from '../../services/transactionService';

interface Wallet {
  id: string;
  name: string;
  balance: string;
  plan: 'Personal' | 'Shared';
  userId?: string;
  color1: string;
  color2: string;
  textColor?: string;
  walletType?: string;
  type?: string;
  collaborators?: Collaborator[];
}

interface Budget {
  id: string;
  category: string;
  amount: string;
  period: string;
  wallet: string;
  left?: string;
  plan?: 'Personal' | 'Shared';
  collaborators?: Collaborator[];
}

const mapTransactionData = (t: any): Transaction => ({
  id: t.id || t._id || '',
  type: t.type,
  amount: t.amount,
  dateISO: typeof t.dateISO === 'string' ? t.dateISO : t.dateISO?.toISOString() || '',
  category: t.category,
  walletFrom: t.walletFrom,
  walletTo: t.walletTo,
  description: t.description,
  createdById: t.createdById,
  createdByName: t.createdByName,
  createdByUsername: t.createdByUsername,
  createdAtISO: t.createdAtISO ? (typeof t.createdAtISO === 'string' ? t.createdAtISO : t.createdAtISO.toISOString()) : '',
  updatedById: t.updatedById,
  updatedByName: t.updatedByName,
  updatedByUsername: t.updatedByUsername,
  updatedAtISO: t.updatedAtISO ? (typeof t.updatedAtISO === 'string' ? t.updatedAtISO : t.updatedAtISO.toISOString()) : ''
});

export default function Shared() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activePage, setActivePage] = useState<'Dashboard' | 'Personal Plan' | 'Shared Plan' | 'Achievements'>('Shared Plan');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedWalletName, setSelectedWalletName] = useState<string>('');
  const [txFilter, setTxFilter] = useState<'All' | 'Expense' | 'Income'>('All');
  const [showTxModal, setShowTxModal] = useState(false);
  const [editTx, setEditTx] = useState<AddTransactionType | null>(null);
  const [showBudgetActionModal, setShowBudgetActionModal] = useState(false);
  const [showEditWalletConfirm, setShowEditWalletConfirm] = useState(false);
  const [showBudgetSelectModal, setShowBudgetSelectModal] = useState(false);
  
  const [showChatModal, setShowChatModal] = useState(false);
  const { currentUser, logActivity } = useAppState();
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);
  const [collaboratorDraft, setCollaboratorDraft] = useState<Collaborator[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [collaboratorModalReturn, setCollaboratorModalReturn] = useState<'none' | 'chat'>('none');
  const { currency } = useCurrency();

  // Determine true owner from collaboratorDraft when available
  const ownerFromCollaborators = collaboratorDraft.find(c => c.role === 'Owner') || null;
  const ownerNameToShow = ownerFromCollaborators ? ownerFromCollaborators.name : currentUser.name;
  const ownerEmailToShow = ownerFromCollaborators ? ownerFromCollaborators.email : currentUser.email;
  const ownerUidToShow = ownerFromCollaborators ? ownerFromCollaborators.firebaseUid : currentUser.id;

  const reloadFinancialData = useCallback(async () => {
    try {
      const [walletsData, budgetsData, transactionsData] = await Promise.all([
        walletService.getWallets().catch(() => []),
        budgetService.getBudgets().catch(() => []),
        transactionService.getTransactions().catch(() => [])
      ]);
      
      setWallets(walletsData.map(w => ({
        id: w.id || w._id || '',
        name: w.name,
        balance: w.balance,
        plan: w.plan,
        userId: w.userId,
        color1: w.color1 || w.backgroundColor || '#e2e8f0',
        color2: w.color2 || w.backgroundColor || '#e2e8f0',
        textColor: w.textColor,
        walletType: w.walletType,
        type: w.walletType,
        collaborators: w.collaborators
      })));
      
      setBudgets(budgetsData.map(b => ({
        id: b.id || b._id || '',
        category: b.category,
        amount: b.amount,
        period: b.period,
        wallet: b.wallet,
        left: b.left,
        plan: b.plan,
        collaborators: b.collaborators
      })));
      
      setTransactions(transactionsData.map(mapTransactionData));
    } catch (err) {
      console.error('Failed to reload data:', err);
    }
  }, []);

  // Migration: Ensure all shared wallets have template/color fields
  type WalletWithTemplate = typeof wallets[number] & {
    template: string;
    backgroundColor: string;
    textColor: string;
    color1: string;
    color2: string;
  };
  const sharedWallets: WalletWithTemplate[] = useMemo(() => {
    return wallets
      .filter(w => w.plan === 'Shared')
      .map(w => {
        const wAny = w as any;
        // Only fill missing fields, never overwrite existing color/template fields
        return {
          ...wAny,
          template: wAny.template || (WALLET_TEMPLATES.find(t => t.bgColor === wAny.backgroundColor && t.textColor === wAny.textColor)?.name ?? 'Default'),
          backgroundColor: wAny.backgroundColor || wAny.color1 || '#e2e8f0',
          textColor: wAny.textColor || '#1a1a1a',
          color1: wAny.color1 || wAny.backgroundColor || '#e2e8f0',
          color2: wAny.color2 || wAny.backgroundColor || '#e2e8f0',
        };
      });
  }, [wallets]);

  const isInitialLoad = useRef(true);

  useEffect(() => {
    reloadFinancialData();
    isInitialLoad.current = false;
    const handler = () => reloadFinancialData();
    window.addEventListener('data-updated', handler as EventListener);
    return () => {
      window.removeEventListener('data-updated', handler as EventListener);
    };
  }, [reloadFinancialData]);

  // Auto-refresh for collaborators - poll every 3 seconds when viewing shared wallets
  useEffect(() => {
    if (sharedWallets.length === 0) return; // Don't poll if no shared wallets
    
    const pollInterval = setInterval(() => {
      // Only poll if page is visible (not in background tab)
      if (document.visibilityState === 'visible') {
        reloadFinancialData();
      }
    }, 3000); // Poll every 3 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [sharedWallets.length, reloadFinancialData]);

  useEffect(() => {
    // Handle navigation state (from Dashboard or other pages)
    const state = location.state as { selectedWalletName?: string; editTransactionId?: string } | null;
    if (state?.selectedWalletName) {
      setSelectedWalletName(state.selectedWalletName);
    } else if (sharedWallets.length > 0 && !selectedWalletName) {
      setSelectedWalletName(sharedWallets[0].name);
    } else if (sharedWallets.length === 0) {
      setSelectedWalletName('');
    }
  }, [sharedWallets, selectedWalletName, location.state]);

  // Handle opening transaction in edit mode from navigation state
  useEffect(() => {
    const state = location.state as { editTransactionId?: string } | null;
    if (state?.editTransactionId && transactions.length > 0) {
      const txToEdit = transactions.find(t => (t.id || t._id) === state.editTransactionId);
      if (txToEdit) {
        const editTxData: AddTransactionType = {
          id: txToEdit.id || txToEdit._id || '',
          type: txToEdit.type,
          amount: txToEdit.amount,
          dateISO: typeof txToEdit.dateISO === 'string' ? txToEdit.dateISO : new Date(txToEdit.dateISO).toISOString(),
          category: txToEdit.category,
          walletFrom: txToEdit.walletFrom,
          walletTo: txToEdit.walletTo,
          description: txToEdit.description,
          createdById: txToEdit.createdById,
          createdByName: txToEdit.createdByName,
          createdByUsername: txToEdit.createdByUsername,
          createdAtISO: typeof txToEdit.createdAtISO === 'string' ? txToEdit.createdAtISO : txToEdit.createdAtISO?.toISOString?.() || '',
          updatedById: txToEdit.updatedById,
          updatedByName: txToEdit.updatedByName,
          updatedByUsername: txToEdit.updatedByUsername,
          updatedAtISO: typeof txToEdit.updatedAtISO === 'string' ? txToEdit.updatedAtISO : txToEdit.updatedAtISO?.toISOString?.() || ''
        };
        setEditTx(editTxData);
        setShowTxModal(true);
        // Clear the state to prevent reopening on re-render
        navigate(location.pathname, { replace: true, state: { selectedWalletName } });
      }
    }
  }, [location.state, transactions, navigate, location.pathname, selectedWalletName]);

  const selectedWallet = useMemo(
    () => sharedWallets.find(w => w.name === selectedWalletName) || null,
    [sharedWallets, selectedWalletName]
  );

  // Get user role for selected wallet
  const canEdit = useMemo(() => {
    if (!selectedWallet || !currentUser) return false;
    return canEditWallet(selectedWallet, currentUser.id, currentUser.email);
  }, [selectedWallet, currentUser]);

  const userIsOwner = useMemo(() => {
    if (!selectedWallet || !currentUser) return false;
    return isOwner(selectedWallet, currentUser.id, currentUser.email);
  }, [selectedWallet, currentUser]);

  useEffect(() => {
    if (selectedWallet) {
      setCollaboratorDraft(selectedWallet.collaborators ? [...selectedWallet.collaborators] : []);
    } else {
      setCollaboratorDraft([]);
    }
  }, [selectedWallet]);

  const selectedWalletKey = selectedWallet ? selectedWallet.id || selectedWallet.name : undefined;

  useEffect(() => {
    if (!selectedWalletKey) {
      setShowChatModal(false);
      setShowCollaboratorModal(false);
      setCollaboratorModalReturn('none');
    }
  }, [selectedWalletKey]);

  const budgetsForSelectedWallet = useMemo(() => {
    if (!selectedWallet) return [] as Budget[];
    return budgets.filter(b => b.plan === 'Shared' && b.wallet === selectedWallet.name);
  }, [budgets, selectedWallet]);

  const rows = budgetsForSelectedWallet.map((b) => {
    const amount = parseFloat(b.amount || '0') || 0;
    const left = parseFloat(b.left || b.amount || '0') || 0;
    const spent = Math.max(amount - left, 0);
    const pct = amount > 0 ? Math.min(Math.max((left / amount) * 100, 0), 100) : 0;
    const pctStep = Math.round(pct / 5) * 5;
    return {
      id: b.id,
      name: b.category,
      allocated: amount,
      spent,
      remaining: left,
      widthClass: `progress-w-${pctStep}`
    };
  });

  const spendingData = useMemo(() => {
    if (!selectedWalletName) return { total: 0, entries: [] as Array<{ cat: string; val: number; pct: number }> };
    const expenseTx = transactions.filter(tx => tx.type === 'Expense' && tx.walletFrom === selectedWalletName);
    const totals: Record<string, number> = {};
    expenseTx.forEach(tx => {
      const cat = tx.category || 'Uncategorized';
      const amt = parseFloat(tx.amount || '0') || 0;
      totals[cat] = (totals[cat] || 0) + amt;
    });
    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    const entries = Object.entries(totals).map(([cat, val]) => ({ cat, val, pct: total > 0 ? (val / total) * 100 : 0 }));
    entries.sort((a, b) => b.val - a.val);
    return { total, entries };
  }, [transactions, selectedWalletName]);

  const handleTransactionSaved = (tx: Transaction) => {
    reloadFinancialData();
    if (editTx && editTx.id === tx.id) {
      setEditTx(null);
    }
  };

  const handleTransactionDeleted = (_tx: Transaction) => {
    reloadFinancialData();
  };

  const handleTabChange = (page: 'Dashboard' | 'Personal Plan' | 'Shared Plan' | 'Achievements') => {
    setActivePage(page);
    if (page === 'Dashboard') navigate('/dashboard');
    if (page === 'Personal Plan') navigate('/personal');
    if (page === 'Shared Plan') navigate('/shared');
    if (page === 'Achievements') navigate('/achievements');
  };

  const filteredTxForWallet = useMemo(() => {
    if (!selectedWalletName) return [] as Transaction[];
    const inWallet = transactions.filter(tx =>
      tx.walletFrom === selectedWalletName || (tx.walletTo && tx.walletTo === selectedWalletName)
    );
    if (txFilter === 'All') return inWallet;
    return inWallet.filter(tx => tx.type === txFilter);
  }, [transactions, selectedWalletName, txFilter]);

  const fmtTime = (iso: string | Date) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return String(iso);
    }
  };

  const persistCollaborators = async (
    next: Collaborator[],
    activity?: { action: 'member_added' | 'member_removed' | 'system_message'; message: string; entityId?: string }
  ) => {
    if (!selectedWallet) return;
    const walletIdentifier = selectedWallet.id;
    const walletName = selectedWallet.name;

    try {
      // Update wallet
      if (walletIdentifier) {
        await walletService.updateWallet(walletIdentifier, { collaborators: next });
      }

      // Update budgets
      const budgetsData = await budgetService.getBudgets();
      for (const budget of budgetsData) {
        if (budget.plan === 'Shared' && budget.wallet === walletName) {
          await budgetService.updateBudget(budget.id || budget._id || '', { collaborators: next });
        }
      }

      // Update local state
      setWallets((prev) => {
        return prev.map((wallet) => {
          const matches = walletIdentifier ? wallet.id === walletIdentifier : wallet.name === walletName;
          return matches ? { ...wallet, collaborators: next } : wallet;
        });
      });

      setBudgets((prev) => {
        return prev.map((budget) => {
          if (budget.plan === 'Shared' && budget.wallet === walletName) {
            return { ...budget, collaborators: next };
          }
          return budget;
        });
      });
    } catch (err) {
      console.error('Failed to persist collaborators:', err);
    }

    setCollaboratorDraft(next);

    try {
      window.dispatchEvent(new CustomEvent('data-updated', { detail: { source: 'collaborator-update' } }));
    } catch {}

    if (activity && selectedWalletKey) {
      logActivity({
        walletId: selectedWalletKey,
        action: activity.action,
        entityType: 'member',
        entityId: activity.entityId || `member-${Date.now()}`,
        message: activity.message
      });
    }
  };

  const handleCollaboratorAdd = (input: string) => {
    if (!selectedWallet) return;
    const trimmed = input.trim();
    if (!trimmed) return;
    // Prefer adding only existing users returned by searchResults
    const user = searchResults.find((u) => (u.email === trimmed || u.username === trimmed || u.email.toLowerCase() === trimmed.toLowerCase())) || null;
    if (!user) {
      // No matching user found — do not add arbitrary emails
      return;
    }

    if (collaboratorDraft.some((collab) => collab.firebaseUid === user.firebaseUid)) return;

    const newCollaborator: Collaborator = {
      firebaseUid: user.firebaseUid,
      name: user.name || (user.username || trimmed),
      email: user.email,
      role: 'Editor'
    };

    persistCollaborators([...collaboratorDraft, newCollaborator], {
      action: 'member_added',
      message: `${currentUser.name} added ${newCollaborator.name} as Editor`,
      entityId: newCollaborator.firebaseUid
    });
  };

  const handleCollaboratorRemove = (firebaseUid: string) => {
    if (!selectedWallet) return;
    const target = collaboratorDraft.find((collab) => collab.firebaseUid === firebaseUid);
    if (!target) return;

    persistCollaborators(
      collaboratorDraft.filter((collab) => collab.firebaseUid !== firebaseUid),
      {
        action: 'member_removed',
        message: `${currentUser.name} removed ${target.name} from the wallet`,
        entityId: firebaseUid
      }
    );
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

  const handleCollaboratorRoleChange = (firebaseUid: string, role: string) => {
    if (!selectedWallet) return;
    const target = collaboratorDraft.find((collab) => collab.firebaseUid === firebaseUid);
    if (!target || target.role === role) return;

    persistCollaborators(
      collaboratorDraft.map((collab) => (collab.firebaseUid === firebaseUid ? { ...collab, role } : collab)),
      {
        action: 'system_message',
        message: `${currentUser.name} set ${target.name} as ${role}`,
        entityId: firebaseUid
      }
    );
  };

  const openCollaboratorModal = (origin: 'panel' | 'chat' = 'panel') => {
    if (!selectedWallet) return;
    if (origin === 'chat') {
      setCollaboratorModalReturn('chat');
      setShowChatModal(false);
    } else {
      setCollaboratorModalReturn('none');
    }
    setCollaboratorDraft(selectedWallet.collaborators ? [...selectedWallet.collaborators] : []);
    setShowCollaboratorModal(true);
  };

  const handleCollaboratorModalClose = () => {
    setShowCollaboratorModal(false);
    if (collaboratorModalReturn === 'chat') {
      setShowChatModal(true);
    }
    setCollaboratorModalReturn('none');
  };

  const collaboratorCount = collaboratorDraft.length;

  return (
    <>
      <div className="shared-page">
        <Navbar activePage={activePage} onPageChange={handleTabChange} />

        <div className="shared-content">
          <section className="shared-top">
            <div className="shared-left">
              {sharedWallets.length > 0 ? (
                <>
                  <div className="shared-title-row">
                    <div className="shared-title-inline">
                      <h2 className="shared-section-title">Select Shared Wallet</h2>
                      <button
                        type="button"
                        className="shared-icon-btn shared-icon-btn--compact"
                        onClick={() => navigate('/add-wallet', { state: { returnTo: '/shared', walletPlan: 'Shared' } })}
                        title="Create shared wallet"
                      >
                        <FaPlus />
                      </button>
                      <button
                        type="button"
                        className="shared-icon-btn shared-icon-btn--compact"
                        onClick={() => openCollaboratorModal('panel')}
                        title={selectedWallet ? `Manage collaborators (${collaboratorCount})` : 'Select a shared wallet first'}
                        disabled={!selectedWallet || !userIsOwner}
                        aria-label={selectedWallet ? `Manage collaborators (${collaboratorCount})` : 'Manage collaborators'}
                      >
                        <FaUsers />
                      </button>
                    </div>
                  </div>

                  <select
                    className="shared-select"
                    value={selectedWalletName}
                    onChange={(e) => setSelectedWalletName(e.target.value)}
                  >
                    {sharedWallets.map((w) => (
                      <option key={w.id} value={w.name}>{w.name}</option>
                    ))}
                  </select>

                  {selectedWallet && (
                    <>
                      <div
                        className={`shared-wallet-card ${canEdit ? 'shared-wallet-card--clickable' : ''}`}
                        style={{
                          background: `linear-gradient(135deg, ${selectedWallet.color1} 0%, ${selectedWallet.color2} 100%)`,
                          color: selectedWallet.textColor
                        }}
                        onClick={canEdit ? () => setShowEditWalletConfirm(true) : undefined}
                        role={canEdit ? "button" : undefined}
                        tabIndex={canEdit ? 0 : undefined}
                        onKeyDown={canEdit ? (e) => { if (e.key === 'Enter' || e.key === ' ') setShowEditWalletConfirm(true); } : undefined}
                      >
                        <div className="shared-wallet-header">
                          <div className="shared-wallet-balance-label">Balance</div>
                        </div>
                        <div className="shared-wallet-balance">{CURRENCY_SYMBOLS[currency]} {formatAmountNoTrailing(selectedWallet.balance || '0')}</div>
                        <div className="shared-wallet-name">{selectedWallet.name}</div>
                        <div className="shared-wallet-plan">{selectedWallet.plan} Wallet</div>
                        <div className="shared-wallet-type">{selectedWallet.walletType || selectedWallet.type || ''}</div>
                      </div>

                    </>
                  )}
                  {showEditWalletConfirm && selectedWallet && (
                    <div className="wallet-modal-overlay" role="dialog" aria-modal="true">
                      <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="wallet-modal-title">Edit wallet?</h3>
                        <p className="wallet-confirm-text">Do you want to edit the wallet <strong>{selectedWallet.name}</strong>?</p>
                        <div className="wallet-confirm-actions">
                          <button className="wallet-modal-btn secondary" onClick={() => setShowEditWalletConfirm(false)}>Cancel</button>
                          <button className="wallet-modal-btn" onClick={() => {
                            setShowEditWalletConfirm(false);
                            navigate('/add-wallet', { state: { returnTo: '/shared', editMode: true, walletData: selectedWallet } });
                          }}>Confirm</button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="shared-section-title">Select Shared Wallet</h2>
                  <div className="shared-empty-state">
                    <p>No shared wallets yet</p>
                    <button
                      type="button"
                      className="shared-create-btn"
                      onClick={() => navigate('/add-wallet', { state: { returnTo: '/shared', walletPlan: 'Shared' } })}
                    >
                      Create Shared Wallet
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="shared-right">
              <div className="shared-title-row">
                <div className="shared-title-inline">
                  <h2 className="shared-section-title">Budget Summary</h2>
                  <button
                    type="button"
                    className="shared-icon-btn shared-icon-btn--inline"
                    onClick={() => setShowBudgetActionModal(true)}
                    title="Manage shared budgets"
                    disabled={!selectedWallet || !canEdit}
                  >
                    <FaPen />
                  </button>
                </div>
                <div className="shared-title-actions">
                  <button
                    type="button"
                    className="shared-icon-btn shared-icon-btn--compact"
                    onClick={() => setShowChatModal(true)}
                    title="Open group chat"
                    disabled={!selectedWallet}
                  >
                    <FaRegCommentDots />
                  </button>
                </div>
              </div>
              <div className="shared-table">
                <div className="shared-table-row shared-table-head">
                  <div>Budget Name</div>
                  <div>Allocated</div>
                  <div>Spent</div>
                  <div>Remaining</div>
                  <div>Status Bar</div>
                </div>
                {rows.map(r => (
                  <div
                    key={r.id}
                    className={`shared-table-row ${canEdit ? 'shared-row-clickable' : ''}`}
                    onClick={canEdit ? () => {
                      const b = budgets.find(x => x.id === r.id);
                      if (b) navigate('/add-budget', { state: { returnTo: '/shared', editMode: true, budgetIndex: budgets.findIndex(x => x.id === b.id), budgetData: b, budgetPlan: 'Shared', lockWalletName: selectedWallet?.name } });
                    } : undefined}
                  >
                    <div>{r.name}</div>
                    <div>{CURRENCY_SYMBOLS[currency]} {formatAmountNoTrailing(String(r.allocated))}</div>
                    <div>{CURRENCY_SYMBOLS[currency]} {formatAmountNoTrailing(String(r.spent))}</div>
                    <div>{CURRENCY_SYMBOLS[currency]} {formatAmountNoTrailing(String(r.remaining))}</div>
                    <div>
                      <div className="dashboard-progress-pill">
                        <div className={`dashboard-progress-remaining ${r.widthClass}`} />
                      </div>
                    </div>
                  </div>
                ))}
                {rows.length === 0 && (
                  <div className="shared-table-empty">No shared budgets for this wallet</div>
                )}
              </div>
            </div>
          </section>

          <div className="shared-bottom-grid">
            <section className="shared-box">
              <div className="shared-box-header">
                <h3>Transaction Feed</h3>
                <div className="shared-filters">
                  <button className={`shared-filter ${txFilter === 'All' ? 'active' : ''}`} onClick={() => setTxFilter('All')}>All</button>
                  <button className={`shared-filter ${txFilter === 'Expense' ? 'active' : ''}`} onClick={() => setTxFilter('Expense')}>Expense</button>
                  <button className={`shared-filter ${txFilter === 'Income' ? 'active' : ''}`} onClick={() => setTxFilter('Income')}>Income</button>
                  <button
                    className="shared-add-tx"
                    title="Add transaction"
                    onClick={() => {
                      setEditTx(null);
                      setShowTxModal(true);
                    }}
                    disabled={!selectedWallet || !canEdit}
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
              {filteredTxForWallet.length === 0 ? (
                <div className="shared-list-empty">No transactions found</div>
              ) : (
                <div className="shared-tx-list">
                  {filteredTxForWallet.map(tx => (
                    <div
                      key={tx.id}
                      className={`shared-tx-item type-${tx.type.toLowerCase()} ${canEdit ? 'shared-tx-item--clickable' : ''}`}
                      onClick={canEdit ? () => { setEditTx(tx as AddTransactionType); setShowTxModal(true); } : undefined}
                    >
                      <div className="shared-tx-top">
                        <span className="shared-tx-type">{tx.type}</span>
                        <span className="shared-tx-amount">{CURRENCY_SYMBOLS[currency]} {formatAmountNoTrailing(tx.amount)}</span>
                      </div>
                      <div className="shared-tx-bottom">
                        <span className="shared-tx-cat">{tx.category || '—'}</span>
                        <span className="shared-tx-date">{fmtTime(tx.dateISO)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="shared-box">
              <h3 className="shared-box-title">Spending Breakdown</h3>
              {spendingData.entries.length === 0 ? (
                <div className="shared-list-empty">No expense data yet</div>
              ) : (
                <div className="shared-chart-wrapper">
                  {(() => {
                    const radius = 60;
                    const circumference = 2 * Math.PI * radius;
                    let offset = 0;
                    return (
                      <svg width="140" height="140" viewBox="0 0 140 140" className="shared-donut">
                        <g transform="translate(70,70) rotate(-90)">
                          {spendingData.entries.map((entry, idx) => {
                            const dash = (entry.pct / 100) * circumference;
                            const gap = circumference - dash;
                            const circle = (
                              <circle
                                key={entry.cat}
                                r={radius}
                                cx={0}
                                cy={0}
                                fill="transparent"
                                stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                                strokeWidth={20}
                                strokeDasharray={`${dash} ${gap}`}
                                strokeDashoffset={offset}
                              />
                            );
                            offset -= dash;
                            return circle;
                          })}
                        </g>
                      </svg>
                    );
                  })()}
                  <ul className="shared-legend">
                    {spendingData.entries.map((e, idx) => (
                      <li key={e.cat} className="shared-legend-item">
                        <span className="shared-legend-swatch" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></span>
                        <span className="shared-legend-label">{e.cat} {e.pct.toFixed(0)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section className="shared-box">
              <h3 className="shared-box-title">Achievements</h3>
            </section>
          </div>
        </div>
      </div>

      <AddTransaction
        isOpen={showTxModal}
        onClose={() => { setShowTxModal(false); setEditTx(null); }}
        defaultWallet={selectedWalletName}
        editTx={editTx}
        onDeleted={(tx) => { setEditTx(null); handleTransactionDeleted(tx); }}
        onSaved={handleTransactionSaved}
      />

      {/* Activity timeline removed */}

      {showChatModal && (
        <div className="shared-dialog-overlay" role="dialog" aria-modal="true">
          <div className="shared-dialog shared-dialog--chat">
            <div className="shared-dialog-header">
              <div>
                <h3>Group Chat</h3>
                <p>{selectedWallet ? `Chat about ${selectedWallet.name}` : 'Pick a shared wallet to start chatting.'}</p>
              </div>
              <div className="shared-dialog-actions">
                <button
                  type="button"
                  className="shared-icon-btn shared-icon-btn--compact"
                  title="Manage collaborators"
                  onClick={() => openCollaboratorModal('chat')}
                  disabled={!selectedWallet}
                  aria-label="Open collaborator manager"
                >
                  <FaUsers />
                </button>
                <button className="shared-dialog-close" onClick={() => setShowChatModal(false)} aria-label="Close group chat">×</button>
              </div>
            </div>
            <div className="shared-dialog-body">
              <CollaboratorChat walletId={selectedWalletKey} walletName={selectedWallet?.name} showHeader={false} />
            </div>
          </div>
        </div>
      )}

      <CollaboratorModal
        isOpen={Boolean(showCollaboratorModal && selectedWallet)}
        onClose={handleCollaboratorModalClose}
        title={selectedWallet?.name ?? 'Shared Wallet'}
        collaborators={collaboratorDraft}
        onAddCollaborator={handleCollaboratorAdd}
        onRemoveCollaborator={handleCollaboratorRemove}
        onRoleChange={handleCollaboratorRoleChange}
        ownerName={ownerNameToShow}
        ownerEmail={ownerEmailToShow}
        variant="wallet"
        ownerUid={ownerUidToShow}
        searchQuery={searchQuery}
        searchResults={searchResults}
        onSearchChange={handleSearchUsers}
      />

      {showBudgetActionModal && selectedWallet && (
        <div className="budget-modal-overlay" role="dialog" aria-modal="true">
          <div className="budget-modal">
            <button className="budget-modal-close" onClick={() => setShowBudgetActionModal(false)} aria-label="Close">×</button>
            <h3 className="budget-modal-title">Budget Actions</h3>
            <div className="budget-modal-buttons">
              <button
                className="budget-modal-button"
                disabled={!canEdit}
                onClick={() => {
                  setShowBudgetActionModal(false);
                  navigate('/add-budget', { state: { returnTo: '/shared', budgetPlan: 'Shared', lockWalletName: selectedWallet.name } });
                }}
              >Add New Budget</button>
              <button
                className="budget-modal-button"
                disabled={budgetsForSelectedWallet.length === 0 || !canEdit}
                onClick={() => {
                  setShowBudgetActionModal(false);
                  setShowBudgetSelectModal(true);
                }}
              >Edit Existing Budget</button>
            </div>
            {budgetsForSelectedWallet.length === 0 && (
              <div className="budget-modal-hint">No shared budgets available for this wallet.</div>
            )}
          </div>
        </div>
      )}

      {showBudgetSelectModal && selectedWallet && (
        <div className="budget-modal-overlay" role="dialog" aria-modal="true">
          <div className="budget-modal">
            <button className="budget-modal-close" onClick={() => setShowBudgetSelectModal(false)} aria-label="Close">×</button>
            <h3 className="budget-modal-title">Select Budget to Edit</h3>
            <div className="budget-select-list">
              {budgetsForSelectedWallet.map(b => (
                <button
                  key={b.id}
                  className="budget-select-item"
                  disabled={!canEdit}
                  onClick={() => {
                    setShowBudgetSelectModal(false);
                    navigate('/add-budget', { state: { returnTo: '/shared', editMode: true, budgetIndex: budgets.findIndex(x => x.id === b.id), budgetData: b, budgetPlan: 'Shared', lockWalletName: selectedWallet.name } });
                  }}
                >{b.category}</button>
              ))}
            </div>
            {budgetsForSelectedWallet.length === 0 && <div className="budget-modal-hint">No budgets found.</div>}
          </div>
        </div>
      )}
    </>
  );
}

