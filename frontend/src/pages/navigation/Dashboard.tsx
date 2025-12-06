import { useState, useEffect, useRef, useMemo } from 'react';
import * as settingsService from '../../services/settingsService';
import { useNavigate } from 'react-router-dom';
import { FaWallet, FaMoneyBill, FaEye, FaEyeSlash, FaDownload } from 'react-icons/fa';
import { formatAmountNoTrailing, CURRENCY_SYMBOLS, DEFAULT_TEXT_COLOR, CHART_COLORS } from '../../utils/shared';
import Navbar from '../components/Navbar';
import * as walletService from '../../services/walletService';
import * as budgetService from '../../services/budgetService';
import * as transactionService from '../../services/transactionService';
import type { Transaction } from '../../services/transactionService';
import { useCurrency } from '../../hooks/useCurrency';

interface Wallet {
  id: string;
  name: string;
  balance: string;
  type: string;
  plan: 'Personal' | 'Shared';
  color1: string;
  color2: string;
  textColor?: string;
  backgroundColor?: string;
}

interface Budget {
  id: string;
  category: string;
  amount: string;
  period: string;
  wallet: string;
  startDate?: string;
  endDate?: string;
  left?: string;
  plan?: 'Personal' | 'Shared';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState<'Dashboard' | 'Personal Plan' | 'Shared Plan' | 'Achievements'>('Dashboard');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { currency } = useCurrency();
  const [hiddenWallets, setHiddenWallets] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<settingsService.UserSettings | null>(null);
  // const [settingsLoading, setSettingsLoading] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const isInitialLoad = useRef(true);
  // Removed WalletSummaryModal and BudgetSummaryModal state
  // New: handle wallet click to redirect to personal/shared page with wallet selected
  const handleWalletClick = (wallet: Wallet) => {
    if (wallet.plan === 'Personal') {
      navigate('/personal', { state: { selectedWalletName: wallet.name } });
    } else if (wallet.plan === 'Shared') {
      navigate('/shared', { state: { selectedWalletName: wallet.name } });
    }
  };

  // New: handle budget click to redirect to personal/shared page with wallet and budget selected
  const handleBudgetClick = (budget: Budget) => {
    // Find the wallet for this budget
    const wallet = wallets.find(w => w.name === budget.wallet);
    if (wallet && wallet.plan === 'Personal') {
      // For personal budgets, show first personal wallet and the budget
      const personalWallets = wallets.filter(w => w.plan === 'Personal');
      const firstPersonalWallet = personalWallets[0];
      navigate('/personal', { state: { selectedWalletName: firstPersonalWallet ? firstPersonalWallet.name : '', selectedBudgetId: budget.id } });
    } else if (wallet && wallet.plan === 'Shared') {
      navigate('/shared', { state: { selectedWalletName: wallet.name, selectedBudgetId: budget.id } });
    } else {
      // Fallback: if wallet not found, just go to personal
      navigate('/personal', { state: { selectedBudgetId: budget.id } });
    }
  };

  const loadData = async (showLoading = false) => {
    // Don't show loading spinner on subsequent loads to prevent glitching
    if (showLoading || isInitialLoad.current) {
      setIsLoading(true);
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
        type: w.walletType,
        plan: w.plan,
        color1: w.color1 || w.backgroundColor || '#e2e8f0',
        color2: w.color2 || w.backgroundColor || '#e2e8f0',
        textColor: w.textColor,
        backgroundColor: w.backgroundColor
      })));

      setBudgets(budgetsData.map(b => ({
        id: b.id || b._id || '',
        category: b.category,
        amount: b.amount,
        period: b.period,
        wallet: b.wallet,
        startDate: b.startDate ? new Date(b.startDate).toISOString() : undefined,
        endDate: b.endDate ? new Date(b.endDate).toISOString() : undefined,
        left: b.left,
        plan: b.plan
      })));

      setTransactions(transactionsData.map(t => ({
        ...t,
        id: t.id || t._id || '',
        dateISO: typeof t.dateISO === 'string' ? t.dateISO : new Date(t.dateISO).toISOString(),
        createdAtISO: typeof t.createdAtISO === 'string' ? t.createdAtISO : t.createdAtISO?.toISOString?.() || '',
        updatedAtISO: typeof t.updatedAtISO === 'string' ? t.updatedAtISO : t.updatedAtISO?.toISOString?.() || ''
      })));
    } catch (err) {
      console.error('Failed to load data:', err);
      // Don't clear data on error, keep previous data visible
    } finally {
      setIsLoading(false);
      isInitialLoad.current = false;
    }
  };


  // Load user settings (including balanceVisibility) on mount
  useEffect(() => {
    (async () => {
      try {
        const s = await settingsService.getSettings();
        setSettings(s);
        if (s.balanceVisibility) {
          setHiddenWallets(new Set(Object.entries(s.balanceVisibility).filter(([_, v]) => v === false).map(([k]) => k)));
        }
      } catch (err) {
        console.error('Failed to load user settings:', err);
      }
    })();
  }, []);

  useEffect(() => {
    loadData(true); // Show loading on initial load
  }, []);

  // Only reload on location change if data-updated event fires, not on every location change
  useEffect(() => {
    const handler = () => loadData(false); // Don't show loading spinner
    window.addEventListener('data-updated', handler as EventListener);
    return () => {
      window.removeEventListener('data-updated', handler as EventListener);
    };
  }, []);

  // Auto-refresh for collaborators - poll every 3 seconds if there are shared wallets
  useEffect(() => {
    const hasSharedWallets = wallets.some(w => w.plan === 'Shared');
    if (!hasSharedWallets) return; // Don't poll if no shared wallets
    
    const pollInterval = setInterval(() => {
      // Only poll if page is visible (not in background tab)
      if (document.visibilityState === 'visible') {
        loadData(false);
      }
    }, 3000); // Poll every 3 seconds

    return () => {
      clearInterval(pollInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallets]);


  const handleNavigateAddWallet = () => {
    navigate('/add-wallet', { state: { returnTo: '/dashboard' } });
  };

  const handleNavigateAddBudget = () => {
    navigate('/add-budget', { state: { returnTo: '/dashboard' } });
  };

  const handleNavbarChange = (page: 'Dashboard' | 'Personal Plan' | 'Shared Plan' | 'Achievements') => {
    setActivePage(page);
    if (page === 'Dashboard') navigate('/dashboard');
    if (page === 'Personal Plan') navigate('/personal');
    if (page === 'Shared Plan') navigate('/shared');
    if (page === 'Achievements') navigate('/achievements');
  };

  // Determine if a transaction is Personal or Shared based on wallet
  const getTransactionPlan = (tx: Transaction): 'Personal' | 'Shared' => {
    const wallet = wallets.find(w => w.name === tx.walletFrom);
    return wallet?.plan || 'Personal';
  };

  // Handle transaction click - navigate to appropriate page and open in edit mode
  const handleTransactionClick = (tx: Transaction) => {
    const plan = getTransactionPlan(tx);
    const txId = tx.id || tx._id || '';
    if (plan === 'Personal') {
      navigate('/personal', { 
        state: { 
          selectedWalletName: tx.walletFrom,
          editTransactionId: txId
        } 
      });
    } else {
      navigate('/shared', { 
        state: { 
          selectedWalletName: tx.walletFrom,
          editTransactionId: txId
        } 
      });
    }
  };

  // Format date for display
  const formatTransactionDate = (dateISO: string | Date) => {
    try {
      const date = typeof dateISO === 'string' ? new Date(dateISO) : dateISO;
      return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }).format(date);
    } catch {
      return 'Invalid date';
    }
  };

  // Get recent transactions sorted by date (most recent first) - no limit, scrollable
  const recentTransactions = transactions
    .sort((a, b) => {
      const dateA = typeof a.dateISO === 'string' ? new Date(a.dateISO) : a.dateISO;
      const dateB = typeof b.dateISO === 'string' ? new Date(b.dateISO) : b.dateISO;
      return dateB.getTime() - dateA.getTime();
    });

  // Find wallet with most recent transaction
  const mostRecentWallet = useMemo(() => {
    if (transactions.length === 0) return null;
    const sorted = [...transactions].sort((a, b) => {
      const dateA = typeof a.dateISO === 'string' ? new Date(a.dateISO) : a.dateISO;
      const dateB = typeof b.dateISO === 'string' ? new Date(b.dateISO) : b.dateISO;
      return dateB.getTime() - dateA.getTime();
    });
    const mostRecentTx = sorted[0];
    return wallets.find(w => w.name === mostRecentTx.walletFrom) || null;
  }, [transactions, wallets]);

  // Calculate spending breakdown with analytics
  // For Personal: combine ALL personal wallets
  // For Shared: show per shared wallet
  const spendingBreakdown = useMemo(() => {
    if (!mostRecentWallet) return { 
      total: 0, 
      entries: [] as Array<{ cat: string; val: number; pct: number }>,
      transactionCount: 0,
      averageAmount: 0,
      topCategory: null as { cat: string; val: number; pct: number } | null,
      walletNames: [] as string[],
      breakdownType: 'none' as 'personal' | 'shared' | 'none',
      expenseTransactions: [] as Transaction[]
    };
    
    let expenseTx: Transaction[] = [];
    let walletNames: string[] = [];
    let breakdownType: 'personal' | 'shared' | 'none' = 'none';
    
    if (mostRecentWallet.plan === 'Personal') {
      // Combine ALL personal wallets
      const personalWallets = wallets.filter(w => w.plan === 'Personal');
      walletNames = personalWallets.map(w => w.name);
      expenseTx = transactions.filter(tx => 
        tx.type === 'Expense' && personalWallets.some(w => w.name === tx.walletFrom)
      );
      breakdownType = 'personal';
    } else {
      // Show per shared wallet
      walletNames = [mostRecentWallet.name];
      expenseTx = transactions.filter(tx => 
        tx.type === 'Expense' && tx.walletFrom === mostRecentWallet.name
      );
      breakdownType = 'shared';
    }
    
    const totals: Record<string, number> = {};
    expenseTx.forEach(tx => {
      const cat = tx.category || 'Uncategorized';
      const amt = parseFloat(tx.amount || '0') || 0;
      totals[cat] = (totals[cat] || 0) + amt;
    });
    
    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    const entries = Object.entries(totals).map(([cat, val]) => ({ 
      cat, 
      val, 
      pct: total > 0 ? (val / total) * 100 : 0 
    }));
    
    entries.sort((a, b) => b.val - a.val);
    const transactionCount = expenseTx.length;
    const averageAmount = transactionCount > 0 ? total / transactionCount : 0;
    const topCategory = entries.length > 0 ? entries[0] : null;
    
    return { total, entries, transactionCount, averageAmount, topCategory, walletNames, breakdownType, expenseTransactions: expenseTx };
  }, [transactions, mostRecentWallet, wallets]);

  // Generate and download receipt-style image report
  const handleDownloadReport = async () => {
    if (!mostRecentWallet || spendingBreakdown.entries.length === 0) return;
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      
      const reportDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const reportTitle = spendingBreakdown.breakdownType === 'personal' 
        ? 'All Personal Wallets' 
        : spendingBreakdown.walletNames.join(', ');
      
      // Sort transactions by date (most recent first)
      const sortedTxs = [...spendingBreakdown.expenseTransactions].sort((a, b) => {
        const dateA = typeof a.dateISO === 'string' ? new Date(a.dateISO) : a.dateISO;
        const dateB = typeof b.dateISO === 'string' ? new Date(b.dateISO) : b.dateISO;
        return dateB.getTime() - dateA.getTime();
      });
      
      // Create receipt HTML - thermal receipt style
      const receiptHTML = `
        <div style="
          width: 280px;
          background: white;
          padding: 15px;
          font-family: 'Courier New', 'Monaco', 'Consolas', monospace;
          font-size: 10px;
          line-height: 1.3;
          color: #000;
          box-sizing: border-box;
          letter-spacing: 0.3px;
        ">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 12px;">
            <div style="font-size: 14px; font-weight: bold; margin-bottom: 4px; letter-spacing: 0.5px;">
              SPENDING ANALYTICS REPORT
            </div>
            <div style="font-size: 9px; color: #555; margin-bottom: 8px;">
              ${spendingBreakdown.breakdownType === 'personal' ? 'All Personal Wallets' : 'Shared Wallet Analysis'}
            </div>
            <div style="border-top: 1px dashed #999; border-bottom: 1px dashed #999; padding: 6px 0;">
              <div style="font-size: 8px; color: #555;">${reportDate}</div>
            </div>
          </div>
          
          <!-- Info -->
          <div style="margin-bottom: 12px; font-size: 9px; line-height: 1.6;">
            <div style="margin-bottom: 3px;">
              <span style="color: #555;">Wallet${spendingBreakdown.walletNames.length > 1 ? 's' : ''}:</span>
              <span style="font-weight: bold; margin-left: 5px;">${spendingBreakdown.walletNames.join(', ')}</span>
            </div>
            <div>
              <span style="color: #555;">Type:</span>
              <span style="font-weight: bold; margin-left: 5px;">${spendingBreakdown.breakdownType === 'personal' ? 'Personal' : 'Shared'}</span>
            </div>
          </div>
          
          <!-- Summary -->
          <div style="border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 8px 0; margin: 12px 0;">
            <div style="font-size: 11px; font-weight: bold; margin-bottom: 8px; text-align: center;">SUMMARY</div>
            <div style="font-size: 9px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="color: #555;">TOTAL SPENDING:</span>
                <span style="font-weight: bold; font-size: 11px;">${CURRENCY_SYMBOLS[currency]} ${formatAmountNoTrailing(String(spendingBreakdown.total))}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="color: #555;">TRANSACTIONS:</span>
                <span style="font-weight: bold; font-size: 11px;">${spendingBreakdown.transactionCount}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="color: #555;">AVERAGE:</span>
                <span style="font-weight: bold; font-size: 11px;">${CURRENCY_SYMBOLS[currency]} ${formatAmountNoTrailing(String(spendingBreakdown.averageAmount))}</span>
              </div>
              ${spendingBreakdown.topCategory ? `
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #555;">TOP CATEGORY:</span>
                <span style="font-weight: bold; font-size: 11px;">${spendingBreakdown.topCategory.cat} (${spendingBreakdown.topCategory.pct.toFixed(0)}%)</span>
              </div>
              ` : ''}
            </div>
          </div>
          
          <!-- Category Breakdown -->
          <div style="margin-bottom: 12px;">
            <div style="font-size: 11px; font-weight: bold; margin-bottom: 6px; border-bottom: 1px solid #000; padding-bottom: 2px;">
              CATEGORY BREAKDOWN
            </div>
            ${spendingBreakdown.entries.map((entry, idx) => {
              const color = CHART_COLORS[idx % CHART_COLORS.length];
              return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px dotted #999;">
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="display: inline-block; width: 10px; height: 10px; background: ${color}; border: 1px solid #000;"></span>
                    <span style="font-weight: bold; font-size: 9px;">${entry.cat}</span>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-weight: bold; font-size: 9px;">${CURRENCY_SYMBOLS[currency]} ${formatAmountNoTrailing(String(entry.val))}</div>
                    <div style="font-size: 8px; color: #555;">${entry.pct.toFixed(1)}%</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          
          <!-- Transaction Details -->
          ${sortedTxs.length > 0 ? `
          <div style="margin-bottom: 12px;">
            <div style="font-size: 11px; font-weight: bold; margin-bottom: 6px; border-bottom: 1px solid #000; padding-bottom: 2px;">
              TRANSACTION DETAILS
            </div>
            ${sortedTxs.map((tx, idx) => {
              const txDate = typeof tx.dateISO === 'string' ? new Date(tx.dateISO) : tx.dateISO;
              const formattedDate = new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              }).format(txDate);
              const categoryText = tx.category || 'Uncategorized';
              return `
                <div style="padding: 6px 0; border-bottom: ${idx < sortedTxs.length - 1 ? '1px dotted #999' : 'none'};">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <div style="font-size: 9px;">
                      <span style="font-weight: bold;">${tx.type}</span>
                      <span style="color: #555; margin-left: 4px;">${categoryText}</span>
                    </div>
                    <div style="font-weight: bold; color: #dc2626; font-size: 9px;">${CURRENCY_SYMBOLS[currency]} ${formatAmountNoTrailing(tx.amount)}</div>
                  </div>
                  <div style="font-size: 8px; color: #555;">${formattedDate}</div>
                  ${tx.description ? `<div style="font-size: 8px; color: #555; font-style: italic; margin-top: 2px;">${tx.description}</div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
          ` : ''}
          
          <!-- Footer -->
          <div style="border-top: 1px dashed #999; padding-top: 8px; margin-top: 12px; text-align: center; font-size: 8px; color: #555; font-style: italic;">
            <div>Generated by CASH</div>
            <div style="margin-top: 2px;">Financial Management System</div>
          </div>
        </div>
      `;
      
      // Create temporary element
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = receiptHTML;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      document.body.appendChild(tempDiv);
      
      // Convert to canvas
      const canvas = await html2canvas(tempDiv.firstElementChild as HTMLElement, {
        width: 280,
        backgroundColor: '#ffffff',
        scale: 3,
        logging: false,
        useCORS: true
      });
      
      // Remove temporary element
      document.body.removeChild(tempDiv);
      
      // Convert to image and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          // Format wallet name for filename
          const walletName = spendingBreakdown.breakdownType === 'personal' 
            ? 'All Personal Wallets' 
            : spendingBreakdown.walletNames.join(' ');
          // Sanitize filename by removing invalid characters
          const sanitizedName = walletName.replace(/[<>:"/\\|?*]/g, '');
          link.download = `${sanitizedName} receipt.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Failed to generate receipt:', err);
      alert('Failed to generate receipt. Please try again.');
    }
  };

  return (
    <div className="dashboard-container">
      <Navbar activePage={activePage} onPageChange={handleNavbarChange} />

      {isLoading && isInitialLoad.current ? (
        <div className="dashboard-content">
          {/* Loading Skeleton */}
          <section className="dashboard-section">
            <h2 className="dashboard-section-title">Wallets</h2>
            <div className="dashboard-cards-wrapper">
              <div className="dashboard-wallet-card dashboard-skeleton-card">
                <div className="dashboard-skeleton-line dashboard-skeleton-line-60-16-12"></div>
                <div className="dashboard-skeleton-line dashboard-skeleton-line-80-32-8"></div>
                <div className="dashboard-skeleton-line dashboard-skeleton-line-50-16"></div>
              </div>
              <div className="dashboard-wallet-card dashboard-skeleton-card">
                <div className="dashboard-skeleton-line dashboard-skeleton-line-60-16-12"></div>
                <div className="dashboard-skeleton-line dashboard-skeleton-line-80-32-8"></div>
                <div className="dashboard-skeleton-line dashboard-skeleton-line-50-16"></div>
              </div>
            </div>
          </section>
          <section className="dashboard-section">
            <h2 className="dashboard-section-title">Budgets</h2>
            <div className="dashboard-cards-wrapper">
              <div className="dashboard-budget-card dashboard-skeleton-card">
                <div className="dashboard-skeleton-line dashboard-skeleton-line-70-20-12"></div>
                <div className="dashboard-skeleton-line dashboard-skeleton-line-60-28-8"></div>
                <div className="dashboard-skeleton-line dashboard-skeleton-line-100-24"></div>
              </div>
              <div className="dashboard-budget-card dashboard-skeleton-card">
                <div className="dashboard-skeleton-line dashboard-skeleton-line-70-20-12"></div>
                <div className="dashboard-skeleton-line dashboard-skeleton-line-60-28-8"></div>
                <div className="dashboard-skeleton-line dashboard-skeleton-line-100-24"></div>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className="dashboard-content">
          {/* Wallets Section */}
          <section className="dashboard-section">
            <h2 className="dashboard-section-title">Wallets</h2>
            <div className="dashboard-cards-wrapper">
              {wallets.length === 0 ? (
                <div className="dashboard-empty-state">
                  <FaWallet className="dashboard-empty-icon" />
                  <p className="dashboard-empty-text">No wallets found</p>
                  <button
                    className="dashboard-add-link"
                    onClick={handleNavigateAddWallet}
                  >
                    Add Wallet
                  </button>
                </div>
              ) : (
                <>
                  {wallets.map((wallet) => (
                    <div
                      key={wallet.id}
                      className="dashboard-wallet-card"
                      style={{
                        background: `linear-gradient(135deg, ${wallet.color1} 0%, ${wallet.color2} 100%)`,
                        color: wallet.textColor || DEFAULT_TEXT_COLOR
                      }}
                      onClick={() => handleWalletClick(wallet)}
                    >
                      <div className="dashboard-wallet-header">
                        <span className="dashboard-wallet-label">Balance</span>
                        <button
                          className="dashboard-wallet-eye"
                          onClick={async (e) => {
                            e.stopPropagation();
                            setHiddenWallets(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(wallet.id)) {
                                newSet.delete(wallet.id);
                              } else {
                                newSet.add(wallet.id);
                              }
                              // Update backend settings
                              const newVisibility: Record<string, boolean> = { ...(settings?.balanceVisibility || {}) };
                              newVisibility[wallet.id] = !newSet.has(wallet.id); // true = visible, false = hidden
                              settingsService.updateSettings({ balanceVisibility: newVisibility })
                                .then(s => setSettings(s))
                                .catch(err => console.error('Failed to update visibility:', err));
                              return newSet;
                            });
                          }}
                          aria-label={hiddenWallets.has(wallet.id) ? 'Show balance' : 'Hide balance'}
                        >
                          {hiddenWallets.has(wallet.id) ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      <div className="dashboard-wallet-balance">
                        {hiddenWallets.has(wallet.id)
                          ? '••••••'
                          : `${CURRENCY_SYMBOLS[currency]} ${formatAmountNoTrailing(wallet.balance)}`
                        }
                      </div>
                      <div className="dashboard-wallet-info-row">
                        <div className="dashboard-wallet-info-group">
                          <span className="dashboard-wallet-name dashboard-wallet-name-no-margin">{wallet.name}</span>
                          <span className="dashboard-wallet-type">{wallet.plan} Wallet</span>
                        </div>
                        <div className="dashboard-wallet-info-icon-outer">
                          <div className="dashboard-wallet-info-icon-inner">
                            <FaWallet />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    className="dashboard-add-card"
                    onClick={handleNavigateAddWallet}
                  >
                    <span className="dashboard-add-plus">+</span>
                  </button>
                </>
              )}
            </div>
          </section>

          {/* Budgets Section */}
          <section className="dashboard-section">
            <h2 className="dashboard-section-title">Budgets</h2>
            <div className="dashboard-cards-wrapper">
              {budgets.length === 0 ? (
                <div className="dashboard-empty-state">
                  <FaMoneyBill className="dashboard-empty-icon" />
                  <p className="dashboard-empty-text">No budgets found</p>
                  <button
                    className="dashboard-add-link"
                    onClick={handleNavigateAddBudget}
                  >
                    Add Budget
                  </button>
                </div>
              ) : (
                <>
                  {budgets.map((budget) => {
                    const derivedPlan: 'Personal' | 'Shared' = budget.plan
                      ? budget.plan
                      : (wallets.some(w => w.name === budget.wallet && w.plan === 'Shared') ? 'Shared' : 'Personal');
                    return (
                      <div
                        key={budget.id}
                        className="dashboard-budget-card"
                        onClick={() => handleBudgetClick(budget)}
                      >
                        <div className="dashboard-budget-category">{budget.category}</div>
                        <div className="dashboard-budget-amount">
                          {CURRENCY_SYMBOLS[currency]} {formatAmountNoTrailing(budget.left || budget.amount)}
                        </div>
                        <div className="dashboard-budget-left">left</div>
                        {(() => {
                          const amount = parseFloat(budget.amount || '0') || 0;
                          const left = parseFloat(budget.left || budget.amount || '0') || 0;
                          const pct = amount > 0 ? Math.min(Math.max((left / amount) * 100, 0), 100) : 0;
                          const pctStep = Math.round(pct / 5) * 5;
                          const widthClass = `progress-w-${pctStep}`;
                          return (
                            <div className="dashboard-progress-pill">
                              <div className={`dashboard-progress-remaining ${widthClass}`} />
                              <div className="dashboard-progress-label">{derivedPlan}</div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                  <button
                    className="dashboard-add-card"
                    onClick={handleNavigateAddBudget}
                  >
                    <span className="dashboard-add-plus">+</span>
                  </button>
                </>
              )}
            </div>
          </section>

          {/* Bottom Sections Grid */}
          <div className="dashboard-bottom-grid">
            <section className="dashboard-box">
              <h3 className="dashboard-box-title">Recent Transactions</h3>
              {recentTransactions.length === 0 ? (
                <div className="dashboard-box-empty">
                  <p>No transactions found</p>
                </div>
              ) : (
                <div className="dashboard-transactions-list">
                  {recentTransactions.map(tx => {
                    const plan = getTransactionPlan(tx);
                    const txId = tx.id || tx._id || '';
                    return (
                      <div 
                        key={txId} 
                        className={`dashboard-transaction-item dashboard-transaction-item-${tx.type.toLowerCase()}`}
                        onClick={() => handleTransactionClick(tx)}
                      >
                        <div className="dashboard-transaction-header">
                          <div className="dashboard-transaction-left">
                            <span className="dashboard-transaction-type">{tx.type}</span>
                            <span className="dashboard-transaction-plan">{plan}</span>
                          </div>
                          <span className="dashboard-transaction-amount">
                            {CURRENCY_SYMBOLS[currency]} {formatAmountNoTrailing(tx.amount)}
                          </span>
                        </div>
                        <div className="dashboard-transaction-footer">
                          <span className="dashboard-transaction-category">{tx.category || '—'}</span>
                          <span className="dashboard-transaction-date">{formatTransactionDate(tx.dateISO)}</span>
                        </div>
                        {tx.description && (
                          <div className="dashboard-transaction-description">{tx.description}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="dashboard-box">
              <div className="dashboard-box-header">
                <h3 className="dashboard-box-title">Spending Breakdown</h3>
                <div className="dashboard-box-header-right">
                  {mostRecentWallet && (
                    <div className="dashboard-spending-wallet-label">
                      <span className="dashboard-wallet-badge">
                        {spendingBreakdown.breakdownType === 'personal' 
                          ? 'All Personal Wallets' 
                          : `Shared Wallet ${spendingBreakdown.walletNames.join(', ')}`}
                      </span>
                    </div>
                  )}
                  {spendingBreakdown.entries.length > 0 && (
                    <button 
                      className="dashboard-download-btn"
                      onClick={handleDownloadReport}
                      title="Download Analytics Report"
                      aria-label="Download Analytics Report"
                    >
                      <FaDownload />
                    </button>
                  )}
                </div>
              </div>
              {spendingBreakdown.entries.length === 0 ? (
                <div className="dashboard-box-empty">
                  <p>No expense data yet</p>
                </div>
              ) : (
                <>
                  {/* Content Wrapper for Chart and Analytics */}
                  <div className="dashboard-spending-content">
                    {/* Chart and Legend - Show First */}
                    <div className="dashboard-chart-wrapper">
                    {(() => {
                      const radius = 60;
                      const circumference = 2 * Math.PI * radius;
                      let offset = 0;
                      return (
                        <svg width="140" height="140" viewBox="0 0 140 140" className="dashboard-donut">
                          <g transform="translate(70,70) rotate(-90)">
                            {spendingBreakdown.entries.map((entry, idx) => {
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
                    <ul className="dashboard-legend">
                      {spendingBreakdown.entries.map((e, idx) => (
                        <li key={e.cat} className="dashboard-legend-item">
                          <span 
                            className="dashboard-legend-swatch" 
                            style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                          ></span>
                          <span className="dashboard-legend-label">{e.cat} {e.pct.toFixed(0)}%</span>
                        </li>
                      ))}
                    </ul>
                    </div>

                    {/* Analytics Summary - Show After Chart */}
                    <div className="dashboard-analytics-summary">
                    <div className="dashboard-analytics-item">
                      <div className="dashboard-analytics-label">Total Spending</div>
                      <div className="dashboard-analytics-value">
                        {CURRENCY_SYMBOLS[currency]} {formatAmountNoTrailing(String(spendingBreakdown.total))}
                      </div>
                    </div>
                    <div className="dashboard-analytics-item">
                      <div className="dashboard-analytics-label">Transactions</div>
                      <div className="dashboard-analytics-value">{spendingBreakdown.transactionCount}</div>
                    </div>
                    <div className="dashboard-analytics-item">
                      <div className="dashboard-analytics-label">Average</div>
                      <div className="dashboard-analytics-value">
                        {CURRENCY_SYMBOLS[currency]} {formatAmountNoTrailing(String(spendingBreakdown.averageAmount))}
                      </div>
                    </div>
                    {spendingBreakdown.topCategory && (
                      <div className="dashboard-analytics-item dashboard-analytics-item-highlight">
                        <div className="dashboard-analytics-label">Top Category</div>
                        <div className="dashboard-analytics-value">
                          {spendingBreakdown.topCategory.cat}
                          <span className="dashboard-analytics-percentage">
                            {spendingBreakdown.topCategory.pct.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                </>
              )}
            </section>

            <section className="dashboard-box">
              <h3 className="dashboard-box-title">Achievements</h3>
              <div className="dashboard-box-empty"></div>
            </section>
          </div>
        </div>

      )}
    </div>
  );
}
