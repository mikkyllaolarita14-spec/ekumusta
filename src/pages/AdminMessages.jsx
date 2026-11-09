import { useCallback, useEffect, useMemo, useState } from "react";

import AdminLayout from "../components/AdminLayout";

import { useAuth } from "../context/AuthContext";

import {
  getAdminMessages,
  getMessageRecipients,
  sendAdminMessage,
  markAdminMessageRead,
  markAllAdminMessagesRead,
  deleteAdminMessage,
} from "../api/messages";

/* 
  |-------------------------------------------------------------------------- 
  | POLLING INTERVAL 
  |-------------------------------------------------------------------------- 
  | 
  | The backend does not currently have broadcasting / WebSockets configured, 
  | so new messages are picked up with periodic polling. 8 seconds keeps 
  | replies feeling fresh without hammering the API. 
  */ 

const POLL_INTERVAL_MS = 8000;

export default function AdminMessages() {
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [staff, setStaff] = useState([]);

  const [selectedMessage, setSelectedMessage] =
    useState(null);

  const [showCompose, setShowCompose] =
    useState(false);

  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newRecipient, setNewRecipient] =
    useState("");

  // "inbox" = messages I received, "sent" = messages I sent
  const [viewMode, setViewMode] = useState("inbox");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ==========================================================
  // LOAD MESSAGES
  // ==========================================================

  const loadMessages = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setError("");
      }

      try {
        const data = await getAdminMessages();

        if (data.success) {
          setMessages(data.messages || []);
        } else if (!silent) {
          setError(
            data.message ||
              "Unable to load messages."
          );
        }
      } catch (err) {
        if (!silent) {
          setError(
            err?.response?.data?.message ||
              "Unable to load messages from the server."
          );
        }
      }
    },
    []
  );

  // ==========================================================
  // LOAD RECIPIENTS
  // ==========================================================

  const loadRecipients = useCallback(async () => {
    try {
      const data = await getMessageRecipients();

      if (data.success) {
        setStaff(data.recipients || []);
      }
    } catch (err) {
      console.error(
        "MESSAGE RECIPIENTS ERROR:",
        err
      );
    }
  }, []);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      setError("");

      await Promise.all([
        loadMessages(),
        loadRecipients(),
      ]);

      setLoading(false);
    };

    loadPage();
  }, [loadMessages, loadRecipients]);

  // ==========================================================
  // POLLING FOR NEW MESSAGES
  // ==========================================================

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadMessages({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [loadMessages]);

  // ==========================================================
  // GROUP MESSAGES INTO CONVERSATIONS
  // ==========================================================

  const conversations = useMemo(() => {
    const map = new Map();
    const adminId = Number(user?.id);
    
    messages.forEach((msg) => {
      const isFromAdmin = Number(msg.senderId) === adminId;
      const otherId = isFromAdmin ? Number(msg.recipientId) : Number(msg.senderId);
      const otherName = isFromAdmin ? msg.recipientName : msg.senderName;
      const key = otherId;
      
      if (!map.has(key)) {
        map.set(key, {
          partnerId: otherId,
          partnerName: otherName,
          messages: [],
          lastMessage: msg,
          unreadCount: 0
        });
      }
      
      const conv = map.get(key);
      conv.messages.push(msg);
      
      // Update last message if this one is newer
      if (new Date(msg.createdAt) > new Date(conv.lastMessage.createdAt)) {
        conv.lastMessage = msg;
      }
      
      if (!msg.isRead && !isFromAdmin) {
        conv.unreadCount++;
      }
    });
    
    // Sort messages within each conversation chronologically
    map.forEach((conv) => {
      conv.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    });
    
    return Array.from(map.values()).sort((a, b) => {
      new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
    });
  }, [messages, user?.id]);

  const sortedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [messages]);

  const inbox = sortedMessages.filter(
    (msg) =>
      Number(msg.recipientId) === Number(user?.id)
  );

  const sent = sortedMessages.filter(
    (msg) =>
      Number(msg.senderId) === Number(user?.id)
  );

  let visibleMessages = conversations;

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    visibleMessages = conversations.filter((conv) => {
      (conv.partnerName || "").toLowerCase().includes(q) ||
      conv.messages.some(m =>
        (m.subject || "").toLowerCase().includes(q) ||
        (m.body || "").toLowerCase().includes(q)
      );
    });
  }

  const unreadCount = inbox.filter(
    (msg) => !msg.isRead
  ).length;

  // ==========================================================
  // READ MESSAGE
  // ==========================================================

  const handleRead = async (msg) => {
    setSelectedMessage(msg);
    setError("");
    setMessage("");

    if (
      !msg.isRead &&
      Number(msg.recipientId) === Number(user?.id)
    ) {
      // Optimistic UI update, then confirm with the API.
      setMessages((current) =>
        current.map((item) =>
          item.id === msg.id
            ? { ...item, isRead: true }
            : item
        )
      );

      setSelectedMessage({
        ...msg,
        isRead: true,
      });

      try {
        await markAdminMessageRead(msg.id);
      } catch (err) {
        console.error(
          "MARK MESSAGE READ ERROR:",
          err
        );

        // Revert on failure — the server is the source of truth.
        setMessages((current) =>
          current.map((item) =>
            item.id === msg.id
              ? { ...item, isRead: false }
              : item
          )
        );
      }
    }
  };

  // ==========================================================
  // COMPOSE (new or reply)
  // ==========================================================

  const openCompose = (draft = {}) => {
    setShowCompose(true);
    setSelectedMessage(null);
    setError("");
    setMessage("");

    setNewRecipient(
      draft.recipientId
        ? String(draft.recipientId)
        : ""
    );

    setNewSubject(draft.subject || "");
    setNewBody("");
  };

  const handleReply = (msg) => {
    if (
      Number(msg.senderId) === Number(user?.id)
    ) {
      return; // Cannot reply to my own message
    }

    openCompose({
      recipientId: msg.senderId,
      subject: `Re: ${msg.subject}`,
    });
  };

  // ==========================================================
  // SEND MESSAGE
  // ==========================================================

  const handleSend = async () => {
    if (
      !newRecipient ||
      !newBody.trim()
    ) {
      setError(
        "Please select a recipient and enter a message."
      );

      return;
    }

    try {
      setSending(true);
      setError("");
      setMessage("");

      const result =
        await sendAdminMessage({
          recipientId: newRecipient,
          subject: newSubject.trim() || "Message",
          body: newBody.trim(),
        });

      if (!result.success) {
        setError(
          result.message ||
            "Unable to send message."
        );

        return;
      }

      setShowCompose(false);
      setNewSubject("");
      setNewBody("");
      setNewRecipient("");

      setMessage(
        "Message sent successfully."
      );

      await loadMessages({ silent: true });

      setViewMode("sent");
    } catch (err) {
      console.error(
        "SEND MESSAGE ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to send message."
      );
    } finally {
      setSending(false);
    }
  };

  // ==========================================================
  // MARK ALL READ
  // ==========================================================

  const handleMarkAllRead = async () => {
    try {
      setError("");
      setMessage("");

      await markAllAdminMessagesRead();

      setMessages((current) =>
        current.map((msg) => {
          if (
            Number(msg.recipientId) === Number(user?.id)
          ) {
            return {
              ...msg,
              isRead: true,
            };
          }

          return msg;
        })
      );

      if (selectedMessage) {
        setSelectedMessage((current) =>
          current
            ? {
                ...current,
                isRead: true,
              }
            : current
        );
      }

      setMessage(
        "All messages marked as read."
      );
    } catch (err) {
      console.error(
        "MARK ALL READ ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to mark messages as read."
      );
    }
  };

  // ==========================================================
  // DELETE MESSAGE
  // ==========================================================

  const handleDeleteMessage = async () => {
    if (!selectedMessage) {
      return;
    }

    const confirmed = window.confirm(
      `Delete this message?\n\nSubject: ${selectedMessage.subject}\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setMessage("");

      await deleteAdminMessage(
        selectedMessage.id
      );

      setMessages((current) =>
        current.filter(
          (msg) => msg.id !== selectedMessage.id
        )
      );

      setSelectedMessage(null);

      setMessage(
        "Message deleted successfully."
      );
    } catch (err) {
      console.error(
        "DELETE MESSAGE ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to delete message."
      );

      // Refresh from the server so the list is accurate.
      await loadMessages({ silent: true });
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-page-header">
          <div>
            <h2>Messages</h2>

            <p>
              Loading messages...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h2>Messages</h2>

          <p>
            Communicate with students and staff members securely.
          </p>
        </div>

        <div className="admin-header-actions">
          {unreadCount > 0 && (
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              onClick={handleMarkAllRead}
            >
              Mark All Read ({unreadCount})
            </button>
          )}

          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => openCompose()}
          >
            Compose Message
          </button>
        </div>
      </div>

      {error && (
        <p
          className="ek-form-error"
          role="alert"
        >
          {error}{" "}
          <button
            type="button"
            className="admin-btn admin-btn-outline"
            onClick={() => loadMessages()}
          >
            Retry
          </button>
        </p>
      )}

      {message && (
        <p
          className="ek-save-ok"
          role="status"
        >
          {message}
        </p>
      )}      <div className="admin-messages-layout">
        {/* ================================================== 
            CONVERSATION LIST 
        ================================================== */}

        <div className="admin-messages-list">
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--ek-border)' }}>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-input"
              style={{ width: '100%', fontSize: '13px', padding: '6px 10px' }}
            />
          </div>
          {visibleMessages.length > 0 ? (
            visibleMessages.map((conv) => (
              <div
                key={conv.partnerId}
                className={`admin-message-item ${
                  selectedMessage?.partnerId === conv.partnerId
                    ? "admin-message-selected"
                    : ""
                } ${conv.unreadCount > 0 ? "admin-message-unread" : ""}`}
                onClick={() => {
                  setSelectedMessage(conv);
                  setShowCompose(false);
                  setError("");
                  setMessage("");
                  // Mark as read if there are unread messages from this partner
                  if (conv.unreadCount > 0) {
                    conv.messages.forEach(m => {
                      if (!m.isRead && Number(m.senderId) !== Number(user?.id)) {
                        markAdminMessageRead(m.id).catch(() => {});
                      }
                    });
                    loadMessages({ silent: true });
                  }
                }}
              >
                <div className="admin-message-sender">
                  <div className="admin-user-avatar admin-user-avatar-sm">
                    {conv.partnerName?.charAt(0)?.toUpperCase() || "?"}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="admin-message-from" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.partnerName}</span>
                      {conv.unreadCount > 0 && (
                        <span style={{ background: 'var(--ek-primary)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="admin-message-preview" style={{ fontSize: '12px', marginTop: '2px' }}>
                      {conv.lastMessage.body?.substring(0, 50)}{conv.lastMessage.body?.length > 50 ? '...' : ''}
                    </div>
                  </div>
                </div>

                <div className="admin-message-time" style={{ fontSize: '11px' }}>
                  {conv.lastMessage.createdAt
                    ? new Date(conv.lastMessage.createdAt).toLocaleDateString()
                    : "—"}
                </div>
              </div>
            ))
          ) : (
            <div className="admin-empty-state">
              <p>
                {searchQuery.trim()
                  ? "No conversations match your search."
                  : "No messages yet."}
              </p>
            </div>
          )}
        </div>

        {/* ================================================== 
            CONVERSATION THREAD / COMPOSE 
        ================================================== */}

        <div className="admin-messages-detail" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {showCompose ? (
            <div className="admin-compose" style={{ flex: 1 }}>
              <h3>Compose Message</h3>

              <div className="admin-field">
                <label className="admin-label">
                  To
                </label>

                <select
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  className="admin-input"
                >
                  <option value="">
                    Select recipient...
                  </option>

                  {staff.map((member) => (
                    <option
                      key={member.id}
                      value={member.id}
                    >
                      {member.name}
                      {member.studentId
                        ? ` — ${member.studentId}`
                        : ""}{" "}
                      ({member.position})
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-field">
                <label className="admin-label">
                  Message
                </label>

                <textarea
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  className="admin-textarea"
                  placeholder="Type your message..."
                  rows={6}
                />
              </div>

              <div className="admin-compose-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => {
                    setShowCompose(false);
                    setError("");
                    setMessage("");
                  }}
                  disabled={sending}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={handleSend}
                  disabled={sending}
                >
                  {sending
                    ? "Sending..."
                    : "Send Message"}
                </button>
              </div>
            </div>
          ) : selectedMessage && selectedMessage.messages ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--ek-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="admin-user-avatar">
                    {selectedMessage.partnerName?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{selectedMessage.partnerName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--ek-text-secondary)' }}>Conversation</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = window.confirm("Delete Conversation?\n\nAre you sure you want to delete this conversation? This action cannot be undone.");
                    if (!confirmed) return;
                    try {
                      setDeleting(true);
                      setError("");
                      setMessage("");
                      // Delete all messages in this conversation
                      const adminId = Number(user?.id);
                      const partnerId = selectedMessage.partnerId;
                      const toDelete = messages.filter(m => 
                        (Number(m.senderId) === adminId && Number(m.recipientId) === partnerId) ||  (Number(m.senderId) === partnerId && Number(m.recipientId) === adminId)
                      );
                      if (toDelete.length === 0) {
                        setError("No messages found to delete.");
                        return;
                      }
                      const results = await Promise.allSettled(toDelete.map(m => deleteAdminMessage(m.id)));
                      const allFailed = results.every(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value?.success === false));
                      if (allFailed) {
                        const firstError = results.find(r => r.status === 'rejected')?.reason?.response?.data?.message ||  results.find(r => r.status === 'fulfilled' && r.value?.success === false)?.value?.message ||  "Failed to delete conversation.";
                        setError(firstError);
                        await loadMessages({ silent: true });
                        return;
                      }
                      await loadMessages({ silent: true });
                      setSelectedMessage(null);
                      setMessage("Conversation deleted successfully.");
                    } catch (err) {
                      setError(err?.response?.data?.message || "Failed to delete conversation.");
                      await loadMessages({ silent: true });
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  disabled={deleting}
                  title="Delete Conversation"
                  aria-label="Delete Conversation"
                  style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>              
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedMessage.messages.map((msg) => {
                  const isFromAdmin = Number(msg.senderId) === Number(user?.id);
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isFromAdmin ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--ek-text-secondary)', textAlign: isFromAdmin ? 'right' : 'left' }}>
                          {isFromAdmin ? 'You' : msg.senderName} • {new Date(msg.createdAt).toLocaleString()}
                        </div>
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: isFromAdmin ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: isFromAdmin ? 'var(--ek-primary)' : 'var(--ek-surface-alt)',
                          color: isFromAdmin ? 'white' : 'var(--ek-text-primary)',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}>
                          <div>{msg.body}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: '12px', borderTop: '1px solid var(--ek-border)', display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder={`Reply to ${selectedMessage.partnerName}...`}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  className="admin-input"
                  style={{ flex: 1 }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && newBody.trim()) {
                    e.preventDefault();
                    setNewRecipient(selectedMessage.partnerId);
                    setNewSubject("");
                    handleSend();
                  }
                }}
                />
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={() => {
                    setNewRecipient(selectedMessage.partnerId);
                    setNewSubject("");
                    handleSend();
                  }}
                  disabled={sending || !newBody.trim()}
                >
                  {sending ? '...' : 'Send'}
                </button>
              </div>
            </div>
          ) : (
            <div className="admin-empty-state">
              <p>
                Select a conversation to view messages.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}