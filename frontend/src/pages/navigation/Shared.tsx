import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { CURRENCY_SYMBOLS, formatAmount, CHART_COLORS, DEFAULT_TEXT_COLOR } from '../../utils/shared';
import type { Collaborator } from '../../utils/shared';
import { FaPlus, FaPen, FaUsers, FaHistory, FaRegCommentDots } from 'react-icons/fa';
import AddTransaction, { type Transaction } from '../components/AddTransaction';
import ActivityLogPanel from '../components/ActivityLogPanel';
import CollaboratorChat from '../components/CollaboratorChat';
import CollaboratorModal from '../components/CollaboratorModal';
import { useAppState } from '../../state/AppStateContext';
import * as walletService from '../../services/walletService';
import * as budgetService from '../../services/budgetService';
import * as transactionService from '../../services/transactionService';
import { useCurrency } from '../../hooks/useCurrency';

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
  createdAtISO: t.createdAtISO?.toString() || '',
  updatedAtISO: t.updatedAtISO?.toString() || ''
});

export default function Shared() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState<'Dashboard' | 'Personal Plan' | 'Shared Plan' | 'Achievements'>('Shared Plan');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedWalletName, setSelectedWalletName] = useState<string>('');
  const [txFilter, setTxFilter] = useState<'All' | 'Expense' | 'Income'>('All');
  const [showTxModal, setShowTxModal] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [showBudgetActionModal, setShowBudgetActionModal] = useState(false);
  const [showBudgetSelectModal, setShowBudgetSelectModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const { currentUser, logActivity } = useAppState();
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);
  const [collaboratorDraft, setCollaboratorDraft] = useState<Collaborator[]>([]);
  const [collaboratorModalReturn, setCollaboratorModalReturn] = useState<'none' | 'chat'>('none');
  const { currency } = useCurrency();

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

  const sharedWallets = useMemo(() => wallets.filter(w => w.plan === 'Shared'), [wallets]);

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

  useEffect(() => {
    if (sharedWallets.length > 0 && !selectedWalletName) {
      setSelectedWalletName(sharedWallets[0].name);
    } else if (sharedWallets.length === 0) {
      setSelectedWalletName('');
    }
  }, [sharedWallets, selectedWalletName]);

  const selectedWallet = useMemo(
    () => sharedWallets.find(w => w.name === selectedWalletName) || null,
    [sharedWallets, selectedWalletName]
  );

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
      setShowActivityModal(false);
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

  const fmtTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
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

    const namePart = trimmed.includes('@') ? trimmed.split('@')[0] : trimmed;
    const emailCandidate = trimmed.includes('@')
      ? trimmed
      : `${trimmed.replace(/\s+/g, '').toLowerCase()}@example.com`;
    const normalizedEmail = emailCandidate.toLowerCase();

    if (collaboratorDraft.some((collab) => collab.email.toLowerCase() === normalizedEmail)) {
      return;
    }

    const newCollaborator: Collaborator = {
      id: `collab-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      name: namePart.trim() || trimmed,
      email: emailCandidate,
      role: 'Editor'
    };

    persistCollaborators([...collaboratorDraft, newCollaborator], {
      action: 'member_added',
      message: `${currentUser.name} added ${newCollaborator.name} as Editor`,
      entityId: newCollaborator.id
    });
  };

  const handleCollaboratorRemove = (id: string) => {
    if (!selectedWallet) return;
    const target = collaboratorDraft.find((collab) => collab.id === id);
    if (!target) return;

    persistCollaborators(
      collaboratorDraft.filter((collab) => collab.id !== id),
      {
        action: 'member_removed',
        message: `${currentUser.name} removed ${target.name} from the wallet`,
        entityId: id
      }
    );
  };

  const handleCollaboratorRoleChange = (id: string, role: string) => {
    if (!selectedWallet) return;
    const target = collaboratorDraft.find((collab) => collab.id === id);
    if (!target || target.role === role) return;

    persistCollaborators(
      collaboratorDraft.map((collab) => (collab.id === id ? { ...collab, role } : collab)),
      {
        action: 'system_message',
        message: `${currentUser.name} set ${target.name} as ${role}`,
        entityId: id
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
                        disabled={!selectedWallet}
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
                        className="shared-wallet-card"
                        style={{
                          background: `linear-gradient(135deg, ${selectedWallet.color1} 0%, ${selectedWallet.color2} 100%)`,
                          color: selectedWallet.textColor || DEFAULT_TEXT_COLOR
                        }}
                      >
                        <div className="shared-wallet-balance-label">Balance</div>
                        <div className="shared-wallet-balance">{CURRENCY_SYMBOLS[currency]} {formatAmount(selectedWallet.balance || '0')}</div>
                        <div className="shared-wallet-name">{selectedWallet.name}</div>
                        <div className="shared-wallet-plan">{selectedWallet.plan} Wallet</div>
                        <div className="shared-wallet-type">{selectedWallet.walletType || selectedWallet.type || ''}</div>
                      </div>

                    </>
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
                    disabled={!selectedWallet}
                  >
                    <FaPen />
                  </button>
                </div>
                <div className="shared-title-actions">
                  <button
                    type="button"
                    className="shared-icon-btn shared-icon-btn--compact"
                    onClick={() => setShowActivityModal(true)}
                    title="Open activity timeline"
                    disabled={!selectedWallet}
                  >
                    <FaHistory />
                  </button>
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
                    className="shared-table-row shared-row-clickable"
                    onClick={() => {
                      const b = budgets.find(x => x.id === r.id);
                      if (b) navigate('/add-budget', { state: { returnTo: '/shared', editMode: true, budgetIndex: budgets.findIndex(x => x.id === b.id), budgetData: b, budgetPlan: 'Shared', lockWalletName: selectedWallet?.name } });
                    }}
                  >
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
                    disabled={!selectedWallet}
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
                      className={`shared-tx-item type-${tx.type.toLowerCase()}`}
                      onClick={() => { setEditTx(tx); setShowTxModal(true); }}
                    >
                      <div className="shared-tx-top">
                        <span className="shared-tx-type">{tx.type}</span>
                        <span className="shared-tx-amount">{CURRENCY_SYMBOLS[currency]} {formatAmount(tx.amount)}</span>
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

      {showActivityModal && (
        <div className="shared-dialog-overlay" role="dialog" aria-modal="true">
          <div className="shared-dialog">
            <div className="shared-dialog-header">
              <div>
                <h3>Activity Timeline</h3>
                <p>{selectedWallet ? `Latest updates for ${selectedWallet.name}` : 'Choose a shared wallet to view activity.'}</p>
              </div>
              <button className="shared-dialog-close" onClick={() => setShowActivityModal(false)} aria-label="Close activity timeline">×</button>
            </div>
            <div className="shared-dialog-body">
              <ActivityLogPanel walletId={selectedWalletKey} walletName={selectedWallet?.name} showHeader={false} />
            </div>
          </div>
        </div>
      )}

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
        ownerName={currentUser.name}
        ownerEmail={currentUser.email}
        variant="wallet"
      />

      {showBudgetActionModal && selectedWallet && (
        <div className="budget-modal-overlay" role="dialog" aria-modal="true">
          <div className="budget-modal">
            <button className="budget-modal-close" onClick={() => setShowBudgetActionModal(false)} aria-label="Close">×</button>
            <h3 className="budget-modal-title">Budget Actions</h3>
            <div className="budget-modal-buttons">
              <button
                className="budget-modal-button"
                onClick={() => {
                  setShowBudgetActionModal(false);
                  navigate('/add-budget', { state: { returnTo: '/shared', budgetPlan: 'Shared', lockWalletName: selectedWallet.name } });
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
