import { useEffect, useMemo, useState } from 'react';
import { useAppState } from '../../state/AppStateContext';
import { triggerSelectDropdown } from '../../utils/shared';
import { FaTimes, FaTrash, FaChevronDown } from 'react-icons/fa';
import * as walletService from '../../services/walletService';
import * as budgetService from '../../services/budgetService';
import * as transactionService from '../../services/transactionService';
import * as customCategoryService from '../../services/customCategoryService';

export type TxType = 'Income' | 'Expense' | 'Transfer';

export interface Transaction {
  id: string;
  type: TxType;
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
}

interface Wallet { name: string; plan: 'Personal' | 'Shared'; balance: string; }
interface Budget { id: string; category: string; amount: string; left?: string; plan?: 'Personal' | 'Shared'; wallet?: string; }

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultWallet?: string; 
  editTx?: Transaction | null;
  onDeleted?: (tx: Transaction) => void;
  onSaved?: (tx: Transaction) => void; 
}

const TRANSACTION_BASE_CATEGORIES = ['Food','Shopping','Bills','Car','Custom'] as const;

export default function AddTransaction({ isOpen, onClose, defaultWallet, editTx, onDeleted, onSaved }: Props) {
  const { currentUser } = useAppState();
  const [type, setType] = useState<TxType>('Expense');
  const [amount, setAmount] = useState<string>('');
  const [dateISO, setDateISO] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [walletFrom, setWalletFrom] = useState<string>(defaultWallet || '');
  const [walletTo, setWalletTo] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const activeWallet = useMemo(() => wallets.find(w => w.name === walletFrom), [walletFrom, wallets]);
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


  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        try {
          const [walletsData, budgetsData] = await Promise.all([
            walletService.getWallets().catch(() => []),
            budgetService.getBudgets().catch(() => [])
          ]);
          setWallets(walletsData.map(w => ({
            name: w.name,
            plan: w.plan,
            balance: w.balance
          })));
          setBudgets(budgetsData.map(b => ({
            id: b.id || b._id,
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
        if (select) triggerSelectDropdown(select);
      }, 50);
      return;
    }
    const parent = e.currentTarget.parentElement;
    if (!parent) return;
    const select = parent.querySelector('select') as HTMLSelectElement | null;
    if (select) triggerSelectDropdown(select);
  };

  const allWallets = useMemo(() => wallets, [wallets]);
  const [mergedCategories, setMergedCategories] = useState<string[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      const extrasFromBudgets: string[] = [];
      budgets.forEach(b => {
        const c = b.category;
        if (c && c.toLowerCase() !== 'income' && !extrasFromBudgets.includes(c)) extrasFromBudgets.push(c);
      });
      let customExtras: string[] = [];
      try {
        customExtras = await customCategoryService.getCustomCategories();
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

  const revertOriginalIfEditing = async (original: Transaction) => {
    const amt = parseFloat(original.amount || '0') || 0;
    
    try {
      const walletsData = await walletService.getWallets();
      const budgetsData = await budgetService.getBudgets();
      
      if (original.type === 'Income') {
        const wallet = walletsData.find(w => w.name === original.walletFrom);
        if (wallet) {
          const newBalance = (parseFloat(wallet.balance) - amt).toFixed(2);
          await walletService.updateWallet(wallet.id || wallet._id || '', { balance: newBalance });
        }
      } else if (original.type === 'Expense') {
        const wallet = walletsData.find(w => w.name === original.walletFrom);
        if (wallet) {
          const newBalance = (parseFloat(wallet.balance) + amt).toFixed(2);
          await walletService.updateWallet(wallet.id || wallet._id || '', { balance: newBalance });
        }
        for (const b of budgetsData) {
          const isMatch = String(b.category).toLowerCase() === String(original.category).toLowerCase();
          const isPersonal = (b.plan || 'Personal') === 'Personal';
          const isSharedMatch = b.plan === 'Shared' && b.wallet === original.walletFrom;
          if (isMatch && (isPersonal || isSharedMatch)) {
            const leftNum = parseFloat(b.left ?? b.amount ?? '0') || 0;
            const newLeft = (leftNum + amt).toFixed(2);
            await budgetService.updateBudget(b.id || b._id || '', { left: newLeft });
          }
        }
      } else if (original.type === 'Transfer') {
        const walletFrom = walletsData.find(w => w.name === original.walletFrom);
        if (walletFrom) {
          const newBalance = (parseFloat(walletFrom.balance) + amt).toFixed(2);
          await walletService.updateWallet(walletFrom.id || walletFrom._id || '', { balance: newBalance });
        }
        if (original.walletTo) {
          const walletTo = walletsData.find(w => w.name === original.walletTo);
          if (walletTo) {
            const newBalance = (parseFloat(walletTo.balance) - amt).toFixed(2);
            await walletService.updateWallet(walletTo.id || walletTo._id || '', { balance: newBalance });
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
        await transactionService.deleteTransaction(editTx.id);
      } catch (err) {
        console.error('Failed to delete old transaction:', err);
      }
    }

    const chosenCategory = customCategory || category;
    
    // Update wallets and budgets
    try {
      const walletsData = await walletService.getWallets();
      const budgetsData = await budgetService.getBudgets();

      if (type === 'Income') {
        const wallet = walletsData.find(w => w.name === walletFrom);
        if (wallet) {
          const newBalance = (parseFloat(wallet.balance) + amt).toFixed(2);
          await walletService.updateWallet(wallet.id || wallet._id || '', { balance: newBalance });
        }
      } else if (type === 'Expense') {
        const wallet = walletsData.find(w => w.name === walletFrom);
        if (wallet) {
          const newBalance = (parseFloat(wallet.balance) - amt).toFixed(2);
          await walletService.updateWallet(wallet.id || wallet._id || '', { balance: newBalance });
        }
        for (const b of budgetsData) {
          const isMatch = String(b.category).toLowerCase() === chosenCategory.toLowerCase();
          const isPersonal = (b.plan || 'Personal') === 'Personal';
          const isSharedMatch = b.plan === 'Shared' && b.wallet === walletFrom;
          if (isMatch && (isPersonal || isSharedMatch)) {
            const leftNum = parseFloat(b.left ?? b.amount ?? '0') || 0;
            const nextLeft = Math.max(leftNum - amt, 0).toFixed(2);
            await budgetService.updateBudget(b.id || b._id || '', { left: nextLeft });
          }
        }
      } else if (type === 'Transfer') {
        const walletFromData = walletsData.find(w => w.name === walletFrom);
        if (walletFromData) {
          const newBalance = (parseFloat(walletFromData.balance) - amt).toFixed(2);
          await walletService.updateWallet(walletFromData.id || walletFromData._id || '', { balance: newBalance });
        }
        if (walletTo) {
          const walletToData = walletsData.find(w => w.name === walletTo);
          if (walletToData) {
            const newBalance = (parseFloat(walletToData.balance) + amt).toFixed(2);
            await walletService.updateWallet(walletToData.id || walletToData._id || '', { balance: newBalance });
          }
        }
      }
    } catch (err) {
      console.error('Failed to update wallets/budgets:', err);
    }

    if (customCategory && !mergedCategories.includes(customCategory)) {
      try {
        await customCategoryService.createCustomCategory(customCategory);
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
        savedTx = await transactionService.updateTransaction(editTx.id, txData);
      } else {
        savedTx = await transactionService.createTransaction(txData);
      }

      try { window.dispatchEvent(new CustomEvent('data-updated', { detail: { source: 'transaction-save' } })); } catch {}

      if (onSaved) onSaved(savedTx);
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
      await transactionService.deleteTransaction(editTx.id);
      try { window.dispatchEvent(new CustomEvent('data-updated', { detail: { source: 'transaction-delete' } })); } catch {}
      onClose();
      if (onDeleted) onDeleted(editTx);
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
            <FaTimes />
          </button>
        </div>
        <div className="tx-modal-body">
          {isSharedWallet && editTx && (
            <div className="tx-audit">
              <div className="tx-audit-row">
                <span className="tx-audit-label">Created by</span>
                <span className="tx-audit-value">{editTx.createdByName || 'Not recorded'} · {formatAuditStamp(editTx.createdAtISO || editTx.dateISO)}</span>
              </div>
              <div className="tx-audit-row">
                <span className="tx-audit-label">Last updated by</span>
                <span className="tx-audit-value">{editTx.updatedByName || editTx.createdByName || 'Not recorded'} · {formatAuditStamp(editTx.updatedAtISO || editTx.dateISO)}</span>
              </div>
            </div>
          )}
          <div className="tx-field">
            <label>Type</label>
            <div className="tx-select">
              <div className={`tx-select-display ${errors.type ? 'input-error' : ''}`} onClick={(e) => e.preventDefault()}>
                <span>{type}</span>
              </div>
              <select value={type} onChange={(e) => setType(e.target.value as TxType)} className="tx-hidden-select">
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
                <option value="Transfer">Transfer</option>
              </select>
              <button type="button" className="tx-select-arrow" onClick={(e) => handleDropdownClick(e, 'type')} aria-label="Change type">
                <FaChevronDown />
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
                <FaChevronDown />
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
                <FaChevronDown />
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
                  <FaChevronDown />
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
              <FaTrash />
            </button>
          )}
          <button type="button" className="tx-btn" onClick={handleSave}>{editTx ? 'Update' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
