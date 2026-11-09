import api from "./axios";

/*
|--------------------------------------------------------------------------
| ID HELPERS
|--------------------------------------------------------------------------
|
| The dedup ref prevents duplicate messages from network retries. It
| persists per draft in sessionStorage so double-clicking "Send" or
| refreshing right after sending never creates two identical rows.
*/

function getOrSetDraftRef(key) {
  try {
    const storageKey = `ekumusta_msg_ref_${key}`;
    let ref = sessionStorage.getItem(storageKey);

    if (!ref) {
      ref =
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID().replace(/-/g, "")
          : `ref-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 12)}`;

      sessionStorage.setItem(storageKey, ref);
    }

    return ref;
  } catch {
    return `ref-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 12)}`;
  }
}

function clearDraftRef(key) {
  try {
    sessionStorage.removeItem(`ekumusta_msg_ref_${key}`);
  } catch {
    /* storage unavailable — dedup still works server-side */
  }
}

/*
|--------------------------------------------------------------------------
| MESSAGES API
|--------------------------------------------------------------------------
*/

export const getAdminMessages = async ({
  conversationId,
} = {}) => {
  const response = await api.get(
    "/admin/messages",
    conversationId
      ? { params: { conversation_id: conversationId } }
      : undefined
  );

  return response.data;
};

export const getMessageRecipients = async () => {
  const response = await api.get(
    "/admin/messages/recipients"
  );

  return response.data;
};

export const sendAdminMessage = async ({
  recipientId,
  subject,
  body,
  draftKey,
}) => {
  const clientRef = getOrSetDraftRef(
    draftKey || `new-${recipientId}`
  );

  const response = await api.post("/admin/messages", {
    recipient_id: recipientId,
    subject,
    body,
    client_ref: clientRef,
  });

  if (response.data?.success) {
    clearDraftRef(draftKey || `new-${recipientId}`);
  }

  return response.data;
};

export const getAdminConversation = async (
  conversationId
) => {
  const response = await api.get("/admin/messages", {
    params: { conversation_id: conversationId },
  });

  return response.data;
};

export const markAdminMessageRead = async (
  messageId
) => {
  const response = await api.patch(
    `/admin/messages/${messageId}/read`
  );

  return response.data;
};

export const markAllAdminMessagesRead = async () => {
  const response = await api.patch(
    "/admin/messages/read-all"
  );

  return response.data;
};

export const deleteAdminMessage = async (
  messageId
) => {
  const response = await api.delete(
    `/admin/messages/${messageId}`
  );

  return response.data;
};
