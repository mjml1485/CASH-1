import { useMemo, useState } from 'react';
import type { ActivityEntry, EntityType } from '../state/AppStateContext';
import { useActivityLog } from '../state/AppStateContext';

interface ActivityLogPanelProps {
  walletId?: string;
  walletName?: string;
  showHeader?: boolean;
}

type FilterName = 'all' | EntityType;

const filterDefinitions: Array<{ label: string; value: FilterName }> = [
  { label: 'All', value: 'all' },
  { label: 'Budgets', value: 'budget' },
  { label: 'Collaborators', value: 'member' },
  { label: 'Group Chat', value: 'comment' }
];

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

export default function ActivityLogPanel({ walletId, walletName, showHeader = true }: ActivityLogPanelProps) {
  const [selectedFilter, setSelectedFilter] = useState<FilterName>('all');
  const entries = useActivityLog(walletId, selectedFilter === 'all' ? undefined : selectedFilter);

  const groupedEntries = useMemo(() => {
    return entries.reduce<Record<string, ActivityEntry[]>>((acc, entry) => {
      const day = entry.createdAt.slice(0, 10);
      acc[day] = acc[day] ? [...acc[day], entry] : [entry];
      return acc;
    }, {});
  }, [entries]);

  const orderedKeys = useMemo(() => Object.keys(groupedEntries).sort((a, b) => (a < b ? 1 : -1)), [groupedEntries]);

  return (
    <div className="shared-activity-panel">
      {showHeader && (
        <div className="shared-activity-header">
          <div>
            <h3 className="shared-box-title">Activity Log</h3>
            <p className="shared-activity-subheading">Tracking budget changes, collaborator updates, and group messages for {walletName ?? 'this wallet'}</p>
          </div>
        </div>
      )}

      <div className="shared-activity-filters">
        {filterDefinitions.map((item) => (
          <button
            key={item.value}
            className={`shared-filter ${selectedFilter === item.value ? 'active' : ''}`}
            onClick={() => setSelectedFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {!walletId ? (
        <div className="shared-activity-empty">
          <p>Select a shared wallet to view recent activity.</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="shared-list-empty">No activity recorded yet.</div>
      ) : (
        <div className="shared-activity-list">
          {orderedKeys.map((day) => (
            <div key={day} className="shared-activity-group">
              <div className="shared-activity-date">{formatTimestamp(`${day}T00:00:00Z`).split(',')[0]}</div>
              <ul className="shared-activity-items">
                {groupedEntries[day]
                  .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
                  .map((entry) => (
                    <li key={entry.id} className="shared-activity-item">
                      <div className="shared-activity-message">{entry.message}</div>
                      <div className="shared-activity-meta">
                        <span>{entry.actorName}</span>
                        <span>•</span>
                        <span>{formatTimestamp(entry.createdAt)}</span>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
