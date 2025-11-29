import { useAppState } from '../../state/AppStateContext';
import { WALLET_TEMPLATES } from '../components/AddWallet';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { CURRENCY_SYMBOLS, formatAmount, CHART_COLORS } from '../../utils/shared';
import { FaPlus, FaPen } from 'react-icons/fa';
// Inlined AddTransaction component from AddTransaction.tsx
import { useEffect as useEffectAddTx, useMemo as useMemoAddTx, useState as useStateAddTx } from 'react';
import { triggerSelectDropdown as triggerSelectDropdownAddTx } from '../../utils/shared';
import { FaTimes as FaTimesAddTx, FaTrash as FaTrashAddTx, FaChevronDown as FaChevronDownAddTx } from 'react-icons/fa';
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
  createdAtISO?: string;
  updatedById?: string;
  updatedByName?: string;
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
        setType(editTx.type);
        setAmount(editTx.amount);
        try { setDateISO(new Date(editTx.dateISO).toISOString().slice(0,16)); } catch { setDateISO(v); }
        setCategory(editTx.category || '');
        setWalletFrom(editTx.walletFrom);
        setWalletTo(editTx.walletTo || '');
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
  const allWallets = useMemoAddTx(() => wallets, [wallets]);
  const [mergedCategories, setMergedCategories] = useStateAddTx<string[]>([]);
  useEffectAddTx(() => {
    const loadCategories = async () => {
      const extrasFromBudgets: string[] = [];
      budgets.forEach(b => {
        const c = b.category;
        if (c && c.toLowerCase() !== 'income' && !extrasFromBudgets.includes(c)) extrasFromBudgets.push(c);
      });
      let customExtras: string[] = [];
      try {
        customExtras = await customCategoryServiceAddTx.getCustomCategories();
      } catch (err) {
        console.error('Failed to load custom categories:', err);
      }
      customExtras = customExtras.filter(c => c.toLowerCase() !== 'income');
      const baseNoCustom = TRANSACTION_BASE_CATEGORIES.filter(c => c !== 'Custom');
      const orderedUnique = [...new Set([...baseNoCustom, ...extrasFromBudgets, ...customExtras])];
      setMergedCategories(orderedUnique);
    };
    loadCategories();
  }, [budgets]);
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!type) errs.type = 'Select a type.';
    const amt = parseFloat(amount || '0') || 0;
    if (amt <= 0) errs.amount = 'Enter a valid amount.';
    if (!dateISO) errs.date = 'Select a date.';
    if (!walletFrom) errs.walletFrom = 'Select a wallet.';
    if (type === 'Transfer' && !walletTo) errs.walletTo = 'Select destination wallet.';
    if (type === 'Expense' && !(category || customCategory)) errs.category = 'Select a category.';
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
    const amt = parseFloat(amount);
    if (editTx && editTx.id) {
      await revertOriginalIfEditing(editTx);
      try {
        await transactionServiceAddTx.deleteTransaction(editTx.id);
      } catch (err) {
        console.error('Failed to delete old transaction:', err);
      }
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
      } else if (type === 'Transfer') {
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
      walletTo: type === 'Transfer' ? walletTo : undefined,
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
    <div className="tx-modal-overlay" role="dialog" aria-modal="true">
      <div className="tx-modal">
        <div className="tx-modal-header">
          <h3>{editTx ? 'Edit Transaction' : 'Add Transaction'}</h3>
          <button className="tx-close" type="button" onClick={onClose} aria-label="Close">
            <FaTimesAddTx />
          </button>
        </div>
        <div className="tx-modal-body">
          {isSharedWallet && editTx && (
            <div className="tx-audit">
              <div className="tx-audit-row">
                <span className="tx-audit-label">Created by</span>
                <span className="tx-audit-value">{editTx.createdByName || 'Not recorded'}  b7 {formatAuditStamp(editTx.createdAtISO || editTx.dateISO)}</span>
              </div>
              <div className="tx-audit-row">
                <span className="tx-audit-label">Last updated by</span>
                <span className="tx-audit-value">{editTx.updatedByName || editTx.createdByName || 'Not recorded'}  b7 {formatAuditStamp(editTx.updatedAtISO || editTx.dateISO)}</span>
              </div>
            </div>
          )}
          <div className="tx-field">
            <label>Type</label>
            <div className="tx-select">
              <div className={`tx-select-display ${errors.type ? 'input-error' : ''}`} onClick={(e) => e.preventDefault()}>
                <span>{type}</span>
              </div>
              <select value={type} onChange={(e) => setType(e.target.value as 'Income' | 'Expense' | 'Transfer')} className="tx-hidden-select">
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
                <option value="Transfer">Transfer</option>
              </select>
              <button type="button" className="tx-select-arrow" onClick={(e) => handleDropdownClick(e, 'type')} aria-label="Change type">
                <FaChevronDownAddTx />
              </button>
            </div>
            {errors.type && <div className="error-text">{errors.type}</div>}
          </div>
          <div className="tx-field">
            <label>Amount</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                let v = e.target.value.replace(/[^0-9.]/g, '');
                const parts = v.split('.');
                if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
                if (parts[1] && parts[1].length > 2) v = parts[0] + '.' + parts[1].substring(0, 2);
                setAmount(v);
              }}
            />
            {errors.amount && <div className="error-text">{errors.amount}</div>}
          </div>
          <div className="tx-field">
            <label>Date</label>
            <input type="datetime-local" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
            {errors.date && <div className="error-text">{errors.date}</div>}
          </div>
          <div className="tx-field">
            <label>Category</label>
            <div className="tx-select">
              {category === 'Custom' ? (
                <>
                  <input
                    type="text"
                    className={`tx-select-input ${errors.category ? 'input-error' : ''}`}
                    placeholder="Custom"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                  />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="tx-hidden-select"
                  >
                    <option value="Custom">Custom</option>
                    {mergedCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <div
                    className={`tx-select-display ${errors.category ? 'input-error' : ''}`}
                    onClick={(e) => e.preventDefault()}
                  >
                    <span className={category ? '' : 'placeholder-text'}>
                      {category || 'Select category'}
                    </span>
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="tx-hidden-select"
                  >
                    <option value="" disabled hidden>Select category</option>
                    {mergedCategories.filter(c => c !== 'Custom').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="Custom">Custom</option>
                  </select>
                </>
              )}
              <button
                type="button"
                className="tx-select-arrow"
                onClick={(e) => handleDropdownClick(e, 'category')}
                aria-label="Change category"
              >
                <FaChevronDownAddTx />
              </button>
            </div>
            {errors.category && <div className="error-text">{errors.category}</div>}
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
          {type === 'Transfer' && (
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
          {editTx && (
            <button type="button" className="tx-btn tx-btn-danger" onClick={handleDelete} title="Delete transaction">
              <FaTrashAddTx />
            </button>
          )}
          <button type="button" className="tx-btn" onClick={handleSave}>{editTx ? 'Update' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
import * as walletService from '../../services/walletService';
import * as budgetService from '../../services/budgetService';
import * as transactionService from '../../services/transactionService';
import { useCurrency } from '../../hooks/useCurrency';
import type { Transaction } from '../../services/transactionService';

interface Wallet {
  id: string;
  name: string;
  balance: string;
  plan: 'Personal' | 'Shared';
  color1: string;
  color2: string;
  textColor?: string;
  walletType?: string;
  type?: string;
}

interface Budget {
  id: string;
  category: string;
  amount: string;
  period: string;
  wallet: string;
  left?: string;
  plan?: 'Personal' | 'Shared';
}

export default function Personal() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState<'Dashboard' | 'Personal Plan' | 'Shared Plan' | 'Achievements'>('Personal Plan');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedWalletName, setSelectedWalletName] = useState<string>('');
  const { currency } = useCurrency();
  const [txFilter, setTxFilter] = useState<'All' | 'Expense' | 'Income'>('All');
  const [showTxModal, setShowTxModal] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editTx, setEditTx] = useState<AddTransactionType | null>(null);
  const [showBudgetActionModal, setShowBudgetActionModal] = useState(false);
  const [showBudgetSelectModal, setShowBudgetSelectModal] = useState(false);

  const isInitialLoad = useRef(true);

  const reloadFinancialData = async (showLoading = false) => {
    // Only show loading on initial load to prevent glitching
    if (showLoading && isInitialLoad.current) {
      // Could add a loading state here if needed, but for now just load silently
    }
    
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
        color1: w.color1 || w.backgroundColor || '#e2e8f0',
        color2: w.color2 || w.backgroundColor || '#e2e8f0',
        textColor: w.textColor,
        walletType: w.walletType,
        type: w.walletType
      })));
      
      setBudgets(budgetsData.map(b => ({
        id: b.id || b._id || '',
        category: b.category,
        amount: b.amount,
        period: b.period,
        wallet: b.wallet,
        left: b.left,
        plan: b.plan
      })));
      
      setTransactions(transactionsData.map(t => ({
        id: t.id || t._id || '',
        type: t.type,
        amount: t.amount,
        dateISO: typeof t.dateISO === 'string' ? t.dateISO : new Date(t.dateISO).toISOString(),
        category: t.category,
        walletFrom: t.walletFrom,
        walletTo: t.walletTo,
        description: t.description,
        createdById: t.createdById,
        createdByName: t.createdByName,
        createdAtISO: typeof t.createdAtISO === 'string' ? t.createdAtISO : t.createdAtISO?.toISOString() || '',
        updatedById: t.updatedById,
        updatedByName: t.updatedByName,
        updatedAtISO: typeof t.updatedAtISO === 'string' ? t.updatedAtISO : t.updatedAtISO?.toISOString() || ''
      })));
    } catch (err) {
      console.error('Failed to reload data:', err);
      // Don't clear data on error, keep previous data visible
    } finally {
      isInitialLoad.current = false;
    }
  };

  // Migration: Ensure all personal wallets have template/color fields
  type WalletWithTemplate = typeof wallets[number] & {
    template: string;
    backgroundColor: string;
    textColor: string;
    color1: string;
    color2: string;
  };
  const personalWallets: WalletWithTemplate[] = useMemo(() => {
    return wallets
      .filter(w => w.plan === 'Personal')
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

  useEffect(() => {
    reloadFinancialData(true); // Initial load
  }, []);

  // Only reload when data-updated event fires, not on every modal/state change
  useEffect(() => {
    const handler = () => reloadFinancialData(false);
    window.addEventListener('data-updated', handler as EventListener);
    return () => {
      window.removeEventListener('data-updated', handler as EventListener);
    };
  }, []);

  useEffect(() => {
    if (personalWallets.length > 0 && !selectedWalletName) {
      setSelectedWalletName(personalWallets[0].name);
    } else if (personalWallets.length === 0) {
      setSelectedWalletName('');
    }
  }, [personalWallets, selectedWalletName]);

  const selectedWallet = useMemo(
    () => personalWallets.find(w => w.name === selectedWalletName) || null,
    [personalWallets, selectedWalletName]
  );

  const budgetsForSelectedWallet = useMemo(() => {
    if (!selectedWallet) return [] as Budget[];
    if (selectedWallet.plan === 'Personal') {
      return budgets.filter(b => (b.plan || 'Personal') === 'Personal');
    }
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
    const wallet = selectedWalletName;
    const expenseTx = transactions.filter(tx => tx.type === 'Expense' && tx.walletFrom === wallet);
    const totals: Record<string, number> = {};
    expenseTx.forEach(tx => {
      const cat = tx.category || 'Uncategorized';
      const amt = parseFloat(tx.amount || '0') || 0;
      totals[cat] = (totals[cat] || 0) + amt;
    });
    const total = Object.values(totals).reduce((a,b) => a + b, 0);
    const entries = Object.entries(totals).map(([cat, val]) => ({ cat, val, pct: total > 0 ? (val / total) * 100 : 0 }));
    entries.sort((a,b) => b.val - a.val);
    return { total, entries };
  }, [transactions, selectedWalletName]);

  const handleTabChange = (page: 'Dashboard' | 'Personal Plan' | 'Shared Plan' | 'Achievements') => {
    setActivePage(page);
    if (page === 'Dashboard') navigate('/dashboard');
    if (page === 'Personal Plan') navigate('/personal');
    if (page === 'Shared Plan') navigate('/shared');
    if (page === 'Achievements') navigate('/achievements');
  };

  const filteredTxForWallet = useMemo(() => {
    const wallet = selectedWalletName;
    const inWallet = transactions.filter(tx =>
      tx.walletFrom === wallet || (tx.walletTo && tx.walletTo === wallet)
    );
    if (txFilter === 'All') return inWallet;
    return inWallet.filter(tx => tx.type === txFilter);
  }, [transactions, selectedWalletName, txFilter]);

  const fmtTime = (iso: string | Date) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch { return String(iso); }
  };

  return (
    <>
    <div className="personal-page">
      <Navbar activePage={activePage} onPageChange={handleTabChange} />

      <div className="personal-content">
        <section className="personal-top">
          <div className="personal-left">
            {personalWallets.length > 0 ? (
              <>
                <div className="personal-title-row">
                  <div className="personal-title-inline">
                    <h2 className="personal-section-title">Select Wallet</h2>
                    <button
                      type="button"
                      className="personal-icon-btn personal-icon-btn--compact"
                      onClick={() => navigate('/add-wallet', { state: { returnTo: '/personal', walletPlan: 'Personal' } })}
                      title="Create personal wallet"
                    >
                      <FaPlus />
                    </button>
                  </div>
                </div>

                <select
                  className="personal-select"
                  value={selectedWalletName}
                  onChange={(e) => setSelectedWalletName(e.target.value)}
                >
                  {personalWallets.map((w) => (
                    <option key={w.id} value={w.name}>{w.name}</option>
                  ))}
                </select>

                {selectedWallet && (
                  <div
                    className="personal-wallet-card"
                    style={{
                      background: `linear-gradient(135deg, ${selectedWallet.color1} 0%, ${selectedWallet.color2} 100%)`,
                      color: selectedWallet.textColor
                    }}
                  >
                    <div className="personal-wallet-header">
                      <div className="personal-wallet-balance-label">Balance</div>
                      <button
                        className="personal-wallet-edit"
                        onClick={() => {
                          navigate('/add-wallet', {
                            state: {
                              returnTo: '/personal',
                              editMode: true,
                              walletData: selectedWallet
                            }
                          });
                        }}
                        title="Edit wallet"
                      >
                        <FaPen />
                      </button>
                    </div>
                    <div className="personal-wallet-balance">{CURRENCY_SYMBOLS[currency]} {formatAmount(selectedWallet.balance || '0')}</div>
                    <div className="personal-wallet-name">{selectedWallet.name}</div>
                    <div className="personal-wallet-plan">{selectedWallet.plan} Wallet</div>
                    <div className="personal-wallet-type">{selectedWallet.walletType || selectedWallet.type || ''}</div>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="personal-section-title">Select Wallet</h2>
                <div className="personal-empty-state">
                  <p>No personal wallets yet</p>
                  <button
                    type="button"
                    className="personal-create-btn"
                    onClick={() => navigate('/add-wallet', { state: { returnTo: '/personal', walletPlan: 'Personal' } })}
                  >
                    Create Personal Wallet
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="personal-right">
            <div className="personal-title-row">
              <div className="personal-title-inline">
                <h2 className="personal-section-title">Budget Summary</h2>
                <button
                  type="button"
                  className="personal-icon-btn personal-icon-btn--inline"
                  onClick={() => setShowBudgetActionModal(true)}
                  title="Budget actions"
                  disabled={!selectedWallet}
                >
                  <FaPen />
                </button>
              </div>
            </div>
            <div className="personal-table">
              <div className="personal-table-row personal-table-head">
                <div>Budget Name</div>
                <div>Allocated</div>
                <div>Spent</div>
                <div>Remaining</div>
                <div>Status Bar</div>
              </div>
                {rows.map(r => (
                <div key={r.id} className="personal-table-row personal-row-clickable" onClick={() => {
                  const b = budgets.find(x => x.id === r.id);
                  if (b) navigate('/add-budget', { state: { returnTo: '/personal', editMode: true, budgetData: b, budgetPlan: b.plan || 'Personal' } }); 
                }}>
                  <div>{r.name}</div>
                  <div>{CURRENCY_SYMBOLS[currency]} {formatAmount(String(r.allocated))}</div>
                  <div>{CURRENCY_SYMBOLS[currency]} {formatAmount(String(r.spent))}</div>
                  <div>{CURRENCY_SYMBOLS[currency]} {formatAmount(String(r.remaining))}</div>
                  <div>
                    <div className="dashboard-progress-pill">
                      <div className={`dashboard-progress-remaining ${r.widthClass}`} />
                    </div>
                  </div>
                </div>
              ))}
              {rows.length === 0 && (
                <div className="personal-table-empty">No budgets found for this wallet</div>
              )}
            </div>
          </div>
        </section>

        <div className="personal-bottom-grid">
          <section className="personal-box">
            <div className="personal-box-header">
              <h3>Transaction Feed</h3>
              <div className="personal-filters">
                <button className={`personal-filter ${txFilter==='All'?'active':''}`} onClick={() => setTxFilter('All')}>All</button>
                <button className={`personal-filter ${txFilter==='Expense'?'active':''}`} onClick={() => setTxFilter('Expense')}>Expense</button>
                <button className={`personal-filter ${txFilter==='Income'?'active':''}`} onClick={() => setTxFilter('Income')}>Income</button>
                <button
                  className="personal-add-tx"
                  title="Add transaction"
                  onClick={() => {
                    setEditTx(null);
                    setShowTxModal(true);
                  }}
                >
                  <FaPlus />
                </button>
              </div>
            </div>
            {filteredTxForWallet.length === 0 ? (
              <div className="personal-list-empty">No transactions found</div>
            ) : (
              <div className="personal-tx-list">
                {filteredTxForWallet.map(tx => (
                  <div key={tx.id} className={`personal-tx-item type-${tx.type.toLowerCase()}`} onClick={() => { setEditTx(tx as AddTransactionType); setShowTxModal(true); }}>
                    <div className="personal-tx-top">
                      <span className="personal-tx-type">{tx.type}</span>
                      <span className="personal-tx-amount">{CURRENCY_SYMBOLS[currency]} {formatAmount(tx.amount)}</span>
                    </div>
                    <div className="personal-tx-bottom">
                      <span className="personal-tx-cat">{tx.category || '—'}</span>
                      <span className="personal-tx-date">{fmtTime(tx.dateISO)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="personal-box">
            <h3 className="personal-box-title">Spending Breakdown</h3>
            {spendingData.entries.length === 0 ? (
              <div className="personal-list-empty">No expense data yet</div>
            ) : (
              <div className="personal-chart-wrapper">
                {(() => {
                  const radius = 60;
                  const circumference = 2 * Math.PI * radius;
                  let offset = 0;
                  return (
                    <svg width="140" height="140" viewBox="0 0 140 140" className="personal-donut">
                      <g transform="translate(70,70) rotate(-90)">
                        {spendingData.entries.map((entry, idx) => {
                          const dash = (entry.pct/100) * circumference;
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
                <ul className="personal-legend">
                  {spendingData.entries.map((e, idx) => (
                    <li key={e.cat} className="personal-legend-item">
                      <span className="personal-legend-swatch personal-legend-swatch-color" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></span>
                      <span className="personal-legend-label">{e.cat} {e.pct.toFixed(0)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="personal-box">
            <h3 className="personal-box-title">Achievements</h3>
            <div className="personal-list-empty"></div>
          </section>
        </div>
      </div>
    </div>
    <AddTransaction
      isOpen={showTxModal}
      onClose={() => { setShowTxModal(false); setEditTx(null); }}
      defaultWallet={selectedWalletName}
      editTx={editTx}
      onDeleted={(_tx) => { setEditTx(null); reloadFinancialData(); }}
      onSaved={() => reloadFinancialData()}
    />
    {showBudgetActionModal && (
      <div className="budget-modal-overlay" role="dialog" aria-modal="true">
        <div className="budget-modal">
          <button className="budget-modal-close" onClick={() => setShowBudgetActionModal(false)} aria-label="Close">×</button>
          <h3 className="budget-modal-title">Budget Actions</h3>
          <div className="budget-modal-buttons">
            <button
              className="budget-modal-button"
              onClick={() => {
                setShowBudgetActionModal(false);
                navigate('/add-budget', { state: { returnTo: '/personal', budgetPlan: selectedWallet?.plan || 'Personal', lockWalletName: selectedWallet?.plan === 'Shared' ? selectedWallet.name : undefined } });
              }}
            >Add New Budget</button>
            <button
              className="budget-modal-button"
              disabled={budgetsForSelectedWallet.length === 0}
              onClick={() => {
                setShowBudgetActionModal(false);
                setShowBudgetSelectModal(true);
              }}
            >Edit Existing Budget</button>
          </div>
          {budgetsForSelectedWallet.length === 0 && (
            <div className="budget-modal-hint">No budgets available for this wallet.</div>
          )}
        </div>
      </div>
    )}
    {showBudgetSelectModal && (
      <div className="budget-modal-overlay" role="dialog" aria-modal="true">
        <div className="budget-modal">
          <button className="budget-modal-close" onClick={() => setShowBudgetSelectModal(false)} aria-label="Close">×</button>
          <h3 className="budget-modal-title">Select Budget to Edit</h3>
          <div className="budget-select-list">
            {budgetsForSelectedWallet.map(b => (
              <button
                key={b.id}
                className="budget-select-item"
                onClick={() => {
                  setShowBudgetSelectModal(false);
                  navigate('/add-budget', { state: { returnTo: '/personal', editMode: true, budgetIndex: budgets.findIndex(x => x.id === b.id), budgetData: b, budgetPlan: b.plan || 'Personal', lockWalletName: b.plan === 'Shared' ? b.wallet : undefined } });
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
