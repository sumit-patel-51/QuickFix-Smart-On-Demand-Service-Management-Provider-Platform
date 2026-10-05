import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";

import { db } from "../firebase";

const useChatPresence = ({ requestId, otherUserId }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!requestId || !otherUserId) {
      setIsOnline(false);
      setLastSeen(null);
      setIsTyping(false);
      return;
    }

    const presenceRef = doc(
      db,
      "chats",
      String(requestId),
      "presence",
      String(otherUserId)
    );

    let presenceData = null;

    const updateOnlineStatus = () => {
      if (!presenceData) {
        setIsOnline(false);
        setIsTyping(false);
        return;
      }

      const timestamp = presenceData.lastSeen;

      if (!timestamp) {
        setIsOnline(false);
        setIsTyping(false);
        return;
      }

      const lastSeenTime = timestamp.toMillis();
      const currentTime = Date.now();

      const difference = currentTime - lastSeenTime;

      const currentlyOnline =
        presenceData.online === true &&
        difference < 30000;

      setIsOnline(currentlyOnline);

      setIsTyping(
        currentlyOnline &&
        presenceData.typing === true
      );
    };

    const unsubscribe = onSnapshot(
      presenceRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          presenceData = null;

          setIsOnline(false);
          setLastSeen(null);
          setIsTyping(false);

          return;
        }

        presenceData = snapshot.data();

        setLastSeen(
          presenceData.lastSeen || null
        );

        updateOnlineStatus();
      },
      (error) => {
        console.error(
          "Chat presence listener error:",
          error
        );

        presenceData = null;

        setIsOnline(false);
        setLastSeen(null);
        setIsTyping(false);
      }
    );

    // Re-check every 5 seconds.
    // This is important because Firestore won't
    // automatically send a new snapshot when time passes.
    const statusInterval = setInterval(() => {
      updateOnlineStatus();
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(statusInterval);
    };
  }, [requestId, otherUserId]);

  return {
    isOnline,
    lastSeen,
    isTyping,
  };
};

export default useChatPresence;