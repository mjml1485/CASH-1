import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { CURRENCY_SYMBOLS, formatAmount, CHART_COLORS, DEFAULT_TEXT_COLOR } from '../../utils/shared';
import { FaPlus, FaPen } from 'react-icons/fa';
import AddTransaction, { type Transaction } from '../components/AddTransaction';

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
  const currency = localStorage.getItem('selectedCurrency') || 'PHP';
  const [txFilter, setTxFilter] = useState<'All' | 'Expense' | 'Income'>('All');
  const [showTxModal, setShowTxModal] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [showBudgetActionModal, setShowBudgetActionModal] = useState(false);
  const [showBudgetSelectModal, setShowBudgetSelectModal] = useState(false);

  const reloadFinancialData = () => {
    const w = sessionStorage.getItem('wallets');
    setWallets(w ? JSON.parse(w) : []);
    const b = sessionStorage.getItem('budgets');
    setBudgets(b ? JSON.parse(b) : []);
    const t = sessionStorage.getItem('transactions');
    setTransactions(t ? JSON.parse(t) : []);
  };

  const personalWallets = useMemo(() => wallets.filter(w => w.plan === 'Personal'), [wallets]);

  useEffect(() => {
    const handler = () => reloadFinancialData();
    window.addEventListener('data-updated', handler as EventListener);
    window.addEventListener('storage', handler as EventListener);
    return () => {
      window.removeEventListener('data-updated', handler as EventListener);
      window.removeEventListener('storage', handler as EventListener);
    };
  }, []);

  useEffect(() => {
    const w = sessionStorage.getItem('wallets');
    const b = sessionStorage.getItem('budgets');
    setWallets(w ? JSON.parse(w) : []);
    setBudgets(b ? JSON.parse(b) : []);
  }, []);

  useEffect(() => {
    const t = sessionStorage.getItem('transactions');
    setTransactions(t ? JSON.parse(t) : []);
  }, [showTxModal, selectedWalletName]);

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

  const fmtTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch { return iso; }
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
                      color: selectedWallet.textColor || DEFAULT_TEXT_COLOR
                    }}
                  >
                    <div className="personal-wallet-balance-label">Balance</div>
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
                  if (b) navigate('/add-budget', { state: { returnTo: '/personal', editMode: true, budgetIndex: budgets.findIndex(x => x.id === b.id), budgetData: b, budgetPlan: b.plan || 'Personal' } });
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
                  <div key={tx.id} className={`personal-tx-item type-${tx.type.toLowerCase()}`} onClick={() => { setEditTx(tx); setShowTxModal(true); }}>
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
                      <span className="personal-legend-swatch" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></span>
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
