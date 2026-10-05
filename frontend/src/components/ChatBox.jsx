import { useEffect, useState, useRef } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { X, Send, MessageCircle } from "lucide-react";
import { db } from "../firebase/firebase";
import useChatPresence from "../firebase/hooks/useChatPresence";

const ChatBox = ({
  requestId,
  currentUserId,
  currentUserRole, // "provider" or "customer"
  otherUserId,
  otherUserName,
  onClose,
}) => {
  const [messages, setMessages] = useState([]);
  const typingTimeoutRef = useRef(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const { isOnline, isTyping } = useChatPresence({
    requestId,
    otherUserId,
  });

  // ============================
  // ROLE-BASED THEME CONFIG
  // ============================
  const isProvider = currentUserRole === "provider";

  const theme = isProvider
    ? {
        headerBg: "bg-blue-600",
        headerIconBg: "bg-white/15",
        statusText: "text-blue-100",
        myBubble: "bg-blue-600 text-white",
        myTime: "text-blue-100",
        emptyIconBg: "bg-sky-50 text-blue-600",
        inputFocus: "focus:border-blue-500 focus:ring-blue-500/10",
        sendBtn: "bg-blue-600 hover:bg-blue-700 text-white",
        quickReply:
          "border-sky-200/90 bg-sky-50/60 text-blue-700 hover:bg-sky-100 hover:border-sky-300",
        dotColor: isOnline ? "bg-emerald-300" : "bg-blue-300/60",
      }
    : {
        headerBg: "bg-orange-500",
        headerIconBg: "bg-white/20",
        statusText: "text-orange-100",
        myBubble: "bg-orange-500 text-white",
        myTime: "text-orange-100",
        emptyIconBg: "bg-orange-50 text-orange-600",
        inputFocus: "focus:border-orange-400 focus:ring-orange-400/10",
        sendBtn: "bg-orange-500 hover:bg-orange-600 text-white",
        quickReply:
          "border-orange-200/90 bg-orange-50/60 text-orange-700 hover:bg-orange-100 hover:border-orange-300",
        dotColor: isOnline ? "bg-emerald-300" : "bg-orange-200/60",
      };

  // ============================
  // QUICK REPLIES PRESETS
  // ============================
  const customerQuickReplies = [
    "Where are you?",
    "When will you arrive?",
    "Please call me",
    "I've shared my location",
  ];

  const providerQuickReplies = [
    "I'm on the way",
    "I've arrived",
    "Please share your location",
    "I'll reach in 10 minutes",
  ];

  const currentQuickReplies = isProvider
    ? providerQuickReplies
    : customerQuickReplies;

  // ============================
  // REAL-TIME MESSAGE LISTENER
  // ============================
  useEffect(() => {
    if (!requestId) return;

    const messagesRef = collection(db, "chats", String(requestId), "messages");
    const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messageList = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setMessages(messageList);
      },
      (err) => {
        console.error("Chat listener error:", err);
      }
    );

    return () => unsubscribe();
  }, [requestId]);

  // Read status update
  useEffect(() => {
    if (!requestId || !currentUserId || messages.length === 0) return;

    const unreadMessages = messages.filter((msg) => {
      const readBy = Array.isArray(msg.readBy) ? msg.readBy : [];
      const isFromOtherUser = String(msg.senderId) !== String(currentUserId);
      const isUnread = !readBy.map(String).includes(String(currentUserId));
      return isFromOtherUser && isUnread;
    });

    if (unreadMessages.length === 0) return;

    const markMessagesAsRead = async () => {
      try {
        await Promise.all(
          unreadMessages.map((msg) =>
            updateDoc(doc(db, "chats", String(requestId), "messages", msg.id), {
              readBy: arrayUnion(String(currentUserId)),
            })
          )
        );
      } catch (err) {
        console.error("Mark messages as read error:", err);
      }
    };

    markMessagesAsRead();
  }, [messages, requestId, currentUserId]);

  // ============================
  // AUTO SCROLL
  // ============================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate();
      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  const handleTyping = async (e) => {
    const value = e.target.value;
    setMessage(value);

    if (!requestId || !currentUserId) return;

    try {
      const presenceRef = doc(
        db,
        "chats",
        String(requestId),
        "presence",
        String(currentUserId)
      );

      await updateDoc(presenceRef, {
        typing: value.trim().length > 0,
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(async () => {
        try {
          await updateDoc(presenceRef, { typing: false });
        } catch (err) {
          console.error("Stop typing error:", err);
        }
      }, 1000);
    } catch (err) {
      console.error("Typing status error:", err);
    }
  };

  // ============================
  // SEND MESSAGE (FORM & QUICK REPLY)
  // ============================
  const sendMessage = async (eOrText) => {
    let textToSend = "";

    if (typeof eOrText === "string") {
      textToSend = eOrText.trim();
    } else if (eOrText && typeof eOrText.preventDefault === "function") {
      eOrText.preventDefault();
      textToSend = message.trim();
    } else {
      textToSend = message.trim();
    }

    if (!textToSend || !requestId || !currentUserId || sending) return;

    try {
      setSending(true);

      await addDoc(collection(db, "chats", String(requestId), "messages"), {
        text: textToSend,
        senderId: String(currentUserId),
        senderRole: currentUserRole,
        createdAt: serverTimestamp(),
        readBy: [],
      });

      setMessage("");
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      try {
        const presenceRef = doc(
          db,
          "chats",
          String(requestId),
          "presence",
          String(currentUserId)
        );
        await updateDoc(presenceRef, { typing: false });
      } catch (err) {
        console.error("Stop typing after send error:", err);
      }
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[430px] w-[325px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_14px_38px_rgba(0,0,0,0.15)] transition-all animate-in fade-in zoom-in-95 duration-200">
      {/* ============================
          DYNAMIC THEMED HEADER
      ============================ */}
      <div
        className={`flex items-center justify-between px-3.5 py-2.5 text-white shadow-xs ${theme.headerBg}`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${theme.headerIconBg} shadow-2xs`}
          >
            <MessageCircle size={16} />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-xs font-bold leading-tight">
              {otherUserName || (isProvider ? "Customer" : "Service Provider")}
            </h3>

            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${theme.dotColor} ${
                  isOnline ? "animate-pulse" : ""
                }`}
              />
              <p className={`text-[10px] leading-none ${theme.statusText}`}>
                {isTyping ? "Typing..." : isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        </div>

        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/20 hover:text-white"
          title="Close chat"
        >
          <X size={15} />
        </button>
      </div>

      {/* ============================
          MESSAGES THREAD (SCROLLBAR HIDDEN)
      ============================ */}
      <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50/70 p-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <div
                className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl shadow-2xs ${theme.emptyIconBg}`}
              >
                <MessageCircle size={17} />
              </div>
              <p className="mt-2 text-xs font-bold text-slate-700">
                No messages yet
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                Send a quick reply or greeting to start.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = String(msg.senderId) === String(currentUserId);

            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-1.5 shadow-2xs ${
                    isMine
                      ? `rounded-2xl rounded-br-xs ${theme.myBubble}`
                      : "rounded-2xl rounded-bl-xs border border-slate-200/80 bg-white text-slate-800"
                  }`}
                >
                  <p className="break-words text-xs leading-relaxed">
                    {msg.text}
                  </p>

                  <div
                    className={`mt-0.5 flex items-center justify-end text-[9px] ${
                      isMine ? theme.myTime : "text-slate-400"
                    }`}
                  >
                    <span>{formatMessageTime(msg.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ============================
          QUICK REPLIES DOCK (SCROLLBAR HIDDEN)
      ============================ */}
      <div className="flex gap-1.5 overflow-x-auto border-t border-slate-100 bg-white/95 px-2.5 py-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {currentQuickReplies.map((reply) => (
          <button
            key={reply}
            type="button"
            onClick={() => sendMessage(reply)}
            disabled={sending}
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium transition active:scale-95 disabled:opacity-50 ${theme.quickReply}`}
          >
            {reply}
          </button>
        ))}
      </div>

      {/* ============================
          INPUT & SUBMIT
      ============================ */}
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-1.5 border-t border-slate-100 bg-white p-2"
      >
        <input
          type="text"
          value={message}
          onChange={handleTyping}
          placeholder="Type a message..."
          disabled={sending}
          maxLength={1000}
          className={`min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 ${theme.inputFocus}`}
        />

        <button
          type="submit"
          disabled={sending || !message.trim()}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-2xs transition active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${theme.sendBtn}`}
          title="Send"
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  );
};

export default ChatBox;