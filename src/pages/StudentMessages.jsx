import { useState } from "react";
import StudentLayout from "../components/StudentLayout";
import { useAuth } from "../context/AuthContext";
import {
  getMessages,
  sendMessage,
  markMessageRead,
  getAllUsers,
} from "../store/database";
import { EmptyState, SearchBox } from "../components/ui";
import Icon from "../components/Icon";

/**
 * Student messaging with the Guidance Office.
 * Students can only ever message staff accounts — the recipient
 * selector is built exclusively from admin/guidance users.
 */
export default function StudentMessages() {
  const { user } = useAuth();

  const [messages, setMessages] = useState(() =>
    getMessages(user?.id || "").sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )
  );
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [search, setSearch] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newRecipient, setNewRecipient] = useState("");
  const [sendError, setSendError] = useState("");

  const staff = getAllUsers().filter((u) => u.role === "admin" || u.role === "guidance");

  const refresh = () =>
    setMessages(
      getMessages(user?.id || "").sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )
    );

  const handleRead = (msg) => {
    setSelectedMessage(msg);
    if (!msg.isRead && msg.recipientId === user?.id) {
      markMessageRead(msg.id);
      refresh();
    }
  };

  const handleSend = () => {
    setSendError("");
    const recipient = staff.find((s) => s.id === newRecipient);
    if (!recipient) {
      setSendError("Please choose a recipient.");
      return;
    }
    if (!newSubject.trim() || !newBody.trim()) {
      setSendError("Please fill in both the subject and your message.");
      return;
    }

    sendMessage({
      senderId: user.id,
      senderName: user.displayName || user.name,
      recipientId: recipient.id,
      recipientName: recipient.name,
      subject: newSubject.trim(),
      body: newBody.trim(),
    });

    refresh();
    setShowCompose(false);
    setNewSubject("");
    setNewBody("");
    setNewRecipient("");
    setSelectedMessage(null);
  };

  const filtered = messages.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.subject.toLowerCase().includes(q) ||
      m.body.toLowerCase().includes(q) ||
      m.senderName.toLowerCase().includes(q)
    );
  });

  const unreadCount = messages.filter(
    (m) => m.recipientId === user?.id && !m.isRead
  ).length;

  return (
    <StudentLayout>
      <div className="admin-page-header">
        <div>
          <h2>Messages</h2>
          <p>Communicate privately with the Guidance Office.</p>
        </div>
        <div className="admin-header-actions">
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => {
              setShowCompose(!showCompose);
              setSendError("");
            }}
          >
            <Icon name="message" size={16} />
            New Message
          </button>
        </div>
      </div>

      {showCompose && (
        <div className="admin-card ek-compose-card">
          <h3 className="ek-compose-title">New Message to Guidance Office</h3>
          <div className="admin-field">
            <label className="admin-label" htmlFor="student-msg-to">To</label>
            <select
              id="student-msg-to"
              value={newRecipient}
              onChange={(e) => setNewRecipient(e.target.value)}
              className="admin-input"
            >
              <option value="">Select a staff member…</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role === "admin" ? "Administrator" : "Guidance Staff"})
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label className="admin-label" htmlFor="student-msg-subject">Subject</label>
            <input
              id="student-msg-subject"
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="admin-input"
              placeholder="What is this message about?"
            />
          </div>
          <div className="admin-field">
            <label className="admin-label" htmlFor="student-msg-body">Message</label>
            <textarea
              id="student-msg-body"
              rows={5}
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              className="admin-input"
              placeholder="Write your message here. It will only be seen by the Guidance Office."
            />
          </div>
          {sendError && (
            <p className="ek-form-error" role="alert">{sendError}</p>
          )}
          <div className="admin-modal-actions">
            <button
              className="admin-btn admin-btn-secondary"
              onClick={() => {
                setShowCompose(false);
                setSendError("");
              }}
            >
              Cancel
            </button>
            <button className="admin-btn admin-btn-primary" onClick={handleSend}>
              Send Message
            </button>
          </div>
        </div>
      )}

      <div className="admin-messages-layout">
        {/* Conversation list */}
        <div className="admin-messages-list">
          <div className="ek-list-toolbar">
            <SearchBox
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages…"
              label="Search messages"
            />
            {unreadCount > 0 && (
              <span className="ek-unread-pill">{unreadCount} unread</span>
            )}
          </div>
          {filtered.length > 0 ? (
            filtered.map((msg) => {
              const isMine = msg.senderId === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`admin-message-item ${selectedMessage?.id === msg.id ? "admin-message-selected" : ""} ${!msg.isRead && msg.recipientId === user?.id ? "admin-message-unread" : ""}`}
                  onClick={() => handleRead(msg)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleRead(msg);
                    }
                  }}
                >
                  <div className="admin-message-sender">
                    <div className="admin-user-avatar admin-user-avatar-sm">
                      {msg.senderName.charAt(0)}
                    </div>
                    <div>
                      <div className="admin-message-from">
                        {isMine ? "You" : msg.senderName}
                      </div>
                      <div className="admin-message-to">
                        {isMine ? `To: ${msg.recipientName}` : "Guidance Office"}
                      </div>
                    </div>
                  </div>
                  <div className="admin-message-content">
                    <div className="admin-message-subject">{msg.subject}</div>
                    <div className="admin-message-preview">{msg.body}</div>
                  </div>
                  <div className="admin-message-time">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState
              kind={search ? "results" : "data"}
              title={search ? "No matching messages" : "No messages yet"}
              message={
                search
                  ? "Try a different search term."
                  : "When the Guidance Office replies to you, the conversation will appear here."
              }
            />
          )}
        </div>

        {/* Message detail */}
        <div className="admin-messages-detail">
          {selectedMessage ? (
            <div className="admin-message-view">
              <h3>{selectedMessage.subject}</h3>
              <div className="admin-message-view-meta">
                <span>
                  {selectedMessage.senderId === user?.id
                    ? `You to ${selectedMessage.recipientName}`
                    : `From ${selectedMessage.senderName}`}
                </span>
                <span>{new Date(selectedMessage.createdAt).toLocaleString()}</span>
              </div>
              <div className="admin-message-view-body">
                {selectedMessage.body}
              </div>
              <button
                className="admin-btn admin-btn-outline"
                onClick={() => {
                  setShowCompose(true);
                  setSendError("");
                }}
              >
                Write a Reply
              </button>
            </div>
          ) : (
            <EmptyState
              title="Select a message"
              message="Choose a conversation from the list to read it here."
            />
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
