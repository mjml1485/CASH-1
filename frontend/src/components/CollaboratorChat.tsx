import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useAppState, useComments } from '../state/AppStateContext';

interface CollaboratorChatProps {
  walletId?: string;
  walletName?: string;
  showHeader?: boolean;
}

const formatTimestamp = (iso: string) => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      month: 'short',
      day: 'numeric'
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

export default function CollaboratorChat({ walletId, walletName, showHeader = true }: CollaboratorChatProps) {
  const { addComment, currentUser } = useAppState();
  const [message, setMessage] = useState('');
  const chatEntries = useComments(walletId, walletId);

  const sortedMessages = useMemo(
    () => chatEntries.slice().sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1)),
    [chatEntries]
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!walletId) return;
    const trimmed = message.trim();
    if (!trimmed) return;

    addComment({
      walletId,
      entityId: walletId,
      message: trimmed
    });

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
