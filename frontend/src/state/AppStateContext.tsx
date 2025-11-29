import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as commentService from '../services/commentService';

const MAX_ACTIVITY = 100;
const MAX_COMMENTS = 50;

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

const defaultUser: CurrentUser = {
  id: '',
  name: 'You',
  email: ''
};

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
  logActivity: (input: LogActivityInput) => Promise<ActivityEntry>;
  addComment: (input: AddCommentInput) => Promise<CommentEntry>;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { currentUser: authUser } = useAuth();

  // Load initial data from backend
  useEffect(() => {
    if (authUser?.uid) {
      const loadData = async () => {
        try {
          const comments = await commentService.getComments().catch(() => []);
          dispatch({
            type: 'LOAD_INITIAL',
            payload: {
              activity: [],
              comments: comments,
              currentUser: {
                id: authUser.uid,
                name: authUser.name || 'You',
                email: authUser.email || ''
              }
            }
          });
        } catch (err) {
          console.error('Failed to load initial data:', err);
          dispatch({
            type: 'LOAD_INITIAL',
            payload: {
              currentUser: {
                id: authUser.uid,
                name: authUser.name || 'You',
                email: authUser.email || ''
              }
            }
          });
        }
      };
      loadData();
    } else {
      dispatch({
        type: 'LOAD_INITIAL',
        payload: {
          currentUser: defaultUser
        }
      });
    }
  }, [authUser]);

  const logActivity = useCallback(
    async (input: LogActivityInput): Promise<ActivityEntry> => {
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
      // Activity backend removed — keep activity locally only
      dispatch({ type: 'LOG_ACTIVITY', payload: entry });
      return entry;
    },
    [state.currentUser.id, state.currentUser.name]
  );

  const addComment = useCallback(
    async (input: AddCommentInput): Promise<CommentEntry> => {
      const entry: CommentEntry = {
        id: generateId(),
        walletId: input.walletId,
        entityId: input.entityId,
        message: input.message,
        authorId: input.authorId || state.currentUser.id,
        authorName: input.authorName || state.currentUser.name,
        createdAt: input.createdAt || new Date().toISOString()
      };
      
      // Save to backend
      try {
        const saved = await commentService.createComment({
          walletId: entry.walletId,
          entityId: entry.entityId,
          message: entry.message,
          authorId: entry.authorId,
          authorName: entry.authorName
        });
        entry.id = saved.id;
        entry.createdAt = saved.createdAt;
      } catch (err) {
        console.error('Failed to save comment to backend:', err);
      }
      
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
