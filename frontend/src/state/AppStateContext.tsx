import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';

export type EntityType = 'wallet' | 'budget' | 'transaction' | 'member' | 'comment' | 'system';

export type ActivityActionType =
  | 'transaction_added'
  | 'transaction_updated'
  | 'transaction_deleted'
  | 'budget_added'
  | 'budget_updated'
  | 'budget_deleted'
  | 'member_added'
  | 'member_removed'
  | 'comment_added'
  | 'system_message';

export interface ActivityEntry {
  id: string;
  walletId: string;
  actorId: string;
  actorName: string;
  action: ActivityActionType;
  entityType: EntityType;
  entityId: string;
  message: string;
  createdAt: string;
}

export interface CommentEntry {
  id: string;
  walletId: string;
  entityId: string;
  authorId: string;
  authorName: string;
  message: string;
  createdAt: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
}

interface AppState {
  currentUser: CurrentUser;
  activity: ActivityEntry[];
  comments: CommentEntry[];
}

const STORAGE_KEYS = {
  activity: 'cash-app-activity-log',
  comments: 'cash-app-comments',
  user: 'cash-app-current-user'
};

const defaultUser: CurrentUser = {
  id: 'user-local-demo',
  name: 'You',
  email: 'demo@cash.app'
};

const MAX_ACTIVITY = 200;
const MAX_COMMENTS = 200;

const initialState: AppState = {
  currentUser: defaultUser,
  activity: [],
  comments: []
};

type Action =
  | { type: 'LOAD_INITIAL'; payload: Partial<AppState> }
  | { type: 'LOG_ACTIVITY'; payload: ActivityEntry }
  | { type: 'ADD_COMMENT'; payload: CommentEntry };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_INITIAL':
      return {
        currentUser: action.payload.currentUser || state.currentUser,
        activity: action.payload.activity || state.activity,
        comments: action.payload.comments || state.comments
      };
    case 'LOG_ACTIVITY':
      return {
        ...state,
        activity: [action.payload, ...state.activity].slice(0, MAX_ACTIVITY)
      };
    case 'ADD_COMMENT':
      return {
        ...state,
        comments: [...state.comments, action.payload].slice(-MAX_COMMENTS)
      };
    default:
      return state;
  }
}

interface LogActivityInput {
  walletId: string;
  action: ActivityActionType;
  entityType: EntityType;
  entityId: string;
  message: string;
  actorId?: string;
  actorName?: string;
  timestamp?: string;
}

interface AddCommentInput {
  walletId: string;
  entityId: string;
  message: string;
  authorId?: string;
  authorName?: string;
  createdAt?: string;
  logActivity?: boolean;
}

interface AppStateContextValue extends AppState {
  logActivity: (input: LogActivityInput) => ActivityEntry;
  addComment: (input: AddCommentInput) => CommentEntry;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

const safeParse = <T,>(raw: string | null): T | undefined => {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const storedActivity = safeParse<ActivityEntry[]>(sessionStorage.getItem(STORAGE_KEYS.activity));
    const storedComments = safeParse<CommentEntry[]>(sessionStorage.getItem(STORAGE_KEYS.comments));
    const storedUser = safeParse<CurrentUser>(sessionStorage.getItem(STORAGE_KEYS.user));
    dispatch({
      type: 'LOAD_INITIAL',
      payload: {
        activity: storedActivity || [],
        comments: storedComments || [],
        currentUser: storedUser || defaultUser
      }
    });
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEYS.activity, JSON.stringify(state.activity));
    } catch {
      /* noop */
    }
  }, [state.activity]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEYS.comments, JSON.stringify(state.comments));
    } catch {
      /* noop */
    }
  }, [state.comments]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEYS.user, JSON.stringify(state.currentUser));
    } catch {
      /* noop */
    }
  }, [state.currentUser]);

  const logActivity = useCallback(
    (input: LogActivityInput): ActivityEntry => {
      const entry: ActivityEntry = {
        id: generateId(),
        walletId: input.walletId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        message: input.message,
        actorId: input.actorId || state.currentUser.id,
        actorName: input.actorName || state.currentUser.name,
        createdAt: input.timestamp || new Date().toISOString()
      };
      dispatch({ type: 'LOG_ACTIVITY', payload: entry });
      return entry;
    },
    [state.currentUser.id, state.currentUser.name]
  );

  const addComment = useCallback(
    (input: AddCommentInput): CommentEntry => {
      const entry: CommentEntry = {
        id: generateId(),
        walletId: input.walletId,
        entityId: input.entityId,
        message: input.message,
        authorId: input.authorId || state.currentUser.id,
        authorName: input.authorName || state.currentUser.name,
        createdAt: input.createdAt || new Date().toISOString()
      };
      dispatch({ type: 'ADD_COMMENT', payload: entry });
      if (input.logActivity !== false) {
        const sanitized = entry.message.replace(/\s+/g, ' ').trim();
        const preview = sanitized.length > 120 ? `${sanitized.slice(0, 117)}...` : sanitized;
        logActivity({
          walletId: input.walletId,
          action: 'comment_added',
          entityType: 'comment',
          entityId: entry.id,
          message: `${entry.authorName} sent a chat message: "${preview}"`
        });
      }
      return entry;
    },
    [logActivity, state.currentUser.id, state.currentUser.name]
  );

  const value = useMemo(
    () => ({
      currentUser: state.currentUser,
      activity: state.activity,
      comments: state.comments,
      logActivity,
      addComment
    }),
    [state.currentUser, state.activity, state.comments, logActivity, addComment]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return ctx;
}

export function useActivityLog(walletId?: string, entityFilter?: EntityType | 'all') {
  const { activity } = useAppState();
  return useMemo(() => {
    let entries = activity;
    if (walletId) entries = entries.filter((item) => item.walletId === walletId);
    const allowedTypes: EntityType[] = ['budget', 'comment', 'member'];
    entries = entries.filter((item) => allowedTypes.includes(item.entityType));
    if (entityFilter && entityFilter !== 'all') {
      entries = entries.filter((item) => item.entityType === entityFilter);
    }
    return entries;
  }, [activity, walletId, entityFilter]);
}

export function useComments(walletId?: string, entityId?: string) {
  const { comments } = useAppState();
  return useMemo(() => {
    let entries = comments;
    if (walletId) entries = entries.filter((item) => item.walletId === walletId);
    if (entityId) entries = entries.filter((item) => item.entityId === entityId);
    return entries;
  }, [comments, walletId, entityId]);
}
