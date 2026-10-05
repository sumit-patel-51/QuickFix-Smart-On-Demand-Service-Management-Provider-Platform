import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

import { db } from "../firebase";

const useChatUnread = ({ requestId, currentUserId }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!requestId || !currentUserId) {
      setUnreadCount(0);
      return;
    }

    const messagesRef = collection(
      db,
      "chats",
      String(requestId),
      "messages"
    );

    const messagesQuery = query(
      messagesRef,
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        let count = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();

          const readBy = Array.isArray(data.readBy)
            ? data.readBy
            : [];

          const isFromOtherUser =
            String(data.senderId) !== String(currentUserId);

          const isUnread = !readBy
            .map(String)
            .includes(String(currentUserId));

          if (isFromOtherUser && isUnread) {
            count++;
          }
        });

        setUnreadCount(count);
      },
      (error) => {
        console.error("Unread message listener error:", error);
      }
    );

    return () => unsubscribe();
  }, [requestId, currentUserId]);

  return unreadCount;
};

export default useChatUnread;