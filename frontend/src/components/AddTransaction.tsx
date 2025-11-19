import { useEffect, useMemo, useState } from 'react';
import { useAppState } from '../state/AppStateContext';
import { triggerSelectDropdown } from '../utils/shared';
import { FaTimes, FaTrash, FaChevronDown } from 'react-icons/fa';

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
      const w = sessionStorage.getItem('wallets');
      const b = sessionStorage.getItem('budgets');
      setWallets(w ? JSON.parse(w) : []);
      setBudgets(b ? JSON.parse(b) : []);
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
  const mergedCategories = useMemo(() => {
    const extrasFromBudgets: string[] = [];
    budgets.forEach(b => {
      const c = b.category;
      if (c && c.toLowerCase() !== 'income' && !extrasFromBudgets.includes(c)) extrasFromBudgets.push(c);
    });
    let customExtras: string[] = [];
    try {
      const raw = sessionStorage.getItem('customCategories');
      if (raw) customExtras = JSON.parse(raw); 
    } catch {}
    customExtras = customExtras.filter(c => c.toLowerCase() !== 'income');
    const baseNoCustom = TRANSACTION_BASE_CATEGORIES.filter(c => c !== 'Custom');
    const orderedUnique = [...new Set([...baseNoCustom, ...extrasFromBudgets, ...customExtras])];
    return orderedUnique;
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

  const revertOriginalIfEditing = (original: Transaction) => {
    const walletsArr = JSON.parse(sessionStorage.getItem('wallets') || '[]');
    const budgetsArr = JSON.parse(sessionStorage.getItem('budgets') || '[]');
    const amt = parseFloat(original.amount || '0') || 0;
    const mutateWallet = (name: string, delta: number) => {
      const idx = walletsArr.findIndex((w: any) => w.name === name);
      if (idx >= 0) {
        const bal = parseFloat(walletsArr[idx].balance || '0') || 0;
        walletsArr[idx].balance = (bal - delta).toFixed(2); 
      }
    };
    if (original.type === 'Income') {
      mutateWallet(original.walletFrom, parseFloat(original.amount));
    } else if (original.type === 'Expense') {
      mutateWallet(original.walletFrom, -amt); 
      budgetsArr.forEach((b: any) => {
        const isMatch = String(b.category).toLowerCase() === String(original.category).toLowerCase();
        const isPersonal = (b.plan || 'Personal') === 'Personal';
        const isSharedMatch = b.plan === 'Shared' && b.wallet === original.walletFrom;
        if (isMatch && (isPersonal || isSharedMatch)) {
          const leftNum = parseFloat(b.left ?? b.amount ?? '0') || 0;
          b.left = (leftNum + amt).toFixed(2);
        }
      });
    } else if (original.type === 'Transfer') {
      mutateWallet(original.walletFrom, -amt);
      if (original.walletTo) mutateWallet(original.walletTo, amt);
    }
    sessionStorage.setItem('wallets', JSON.stringify(walletsArr));
    sessionStorage.setItem('budgets', JSON.stringify(budgetsArr));
  };

  const handleSave = () => {
    if (!validate()) return;

    const amt = parseFloat(amount);
    const rawWallets = sessionStorage.getItem('wallets');
    const rawBudgets = sessionStorage.getItem('budgets');
    const rawTx = sessionStorage.getItem('transactions');
    const walletsArr: any[] = rawWallets ? JSON.parse(rawWallets) : [];
    const budgetsArr: any[] = rawBudgets ? JSON.parse(rawBudgets) : [];
    const txArr: Transaction[] = rawTx ? JSON.parse(rawTx) : [];

    if (editTx) {
      revertOriginalIfEditing(editTx);
      const rw = sessionStorage.getItem('wallets');
      const rb = sessionStorage.getItem('budgets');
      const rt = sessionStorage.getItem('transactions');
      walletsArr.splice(0, walletsArr.length, ... (rw ? JSON.parse(rw) : []));
      budgetsArr.splice(0, budgetsArr.length, ... (rb ? JSON.parse(rb) : []));
      const originalIdx = (rt ? JSON.parse(rt) : txArr).findIndex((t: Transaction) => t.id === editTx.id);
      if (originalIdx >= 0) txArr.splice(originalIdx, 1);
    }

    const mutateWallet = (name: string, delta: number) => {
      const idx = walletsArr.findIndex(w => w.name === name);
      if (idx >= 0) {
        const bal = parseFloat(walletsArr[idx].balance || '0') || 0;
        const newBal = (bal + delta).toFixed(2);
        walletsArr[idx] = { ...walletsArr[idx], balance: newBal };
      }
    };

    const chosenCategory = customCategory || category;
    if (type === 'Income') {
      mutateWallet(walletFrom, amt);
    } else if (type === 'Expense') {
      mutateWallet(walletFrom, -amt);
      budgetsArr.forEach((b: any, idx: number) => {
        const isMatch = String(b.category).toLowerCase() === chosenCategory.toLowerCase();
        const isPersonal = (b.plan || 'Personal') === 'Personal';
        const isSharedMatch = b.plan === 'Shared' && b.wallet === walletFrom;
        if (isMatch && (isPersonal || isSharedMatch)) {
          const leftNum = parseFloat(b.left ?? b.amount ?? '0') || 0;
          const nextLeft = Math.max(leftNum - amt, 0).toFixed(2);
          budgetsArr[idx] = { ...b, left: nextLeft };
        }
      });
    } else if (type === 'Transfer') {
      mutateWallet(walletFrom, -amt);
      if (walletTo) mutateWallet(walletTo, amt);
    }

    if (customCategory && !mergedCategories.includes(customCategory)) {
      try {
        const existing = sessionStorage.getItem('customCategories');
        const list = existing ? JSON.parse(existing) : [];
        if (!list.includes(customCategory)) {
          list.push(customCategory);
          sessionStorage.setItem('customCategories', JSON.stringify(list));
        }
      } catch {}
    }

    const nowIso = new Date().toISOString();
    const actorId = currentUser.id;
    const actorName = currentUser.name;
    const tx: Transaction = {
      id: editTx ? editTx.id : Date.now().toString(),
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

    txArr.push(tx);

    sessionStorage.setItem('wallets', JSON.stringify(walletsArr));
    sessionStorage.setItem('budgets', JSON.stringify(budgetsArr));
    sessionStorage.setItem('transactions', JSON.stringify(txArr));

    try { window.dispatchEvent(new CustomEvent('data-updated', { detail: { source: 'transaction-save' } })); } catch {}

    if (onSaved) onSaved(tx);
    onClose();
  };

  const handleDelete = () => {
    if (!editTx) return;
    revertOriginalIfEditing(editTx);
    const rawTx = sessionStorage.getItem('transactions');
    const txArr: Transaction[] = rawTx ? JSON.parse(rawTx) : [];
    const idx = txArr.findIndex(t => t.id === editTx.id);
    if (idx >= 0) txArr.splice(idx, 1);
    sessionStorage.setItem('transactions', JSON.stringify(txArr));
    try { window.dispatchEvent(new CustomEvent('data-updated', { detail: { source: 'transaction-delete' } })); } catch {}
    onClose();
    if (onDeleted) onDeleted(editTx);
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
