import { useEffect } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import { db } from "../firebase";

const useChatPresenceWriter = ({ requestId, currentUserId }) => {
  useEffect(() => {
    if (!requestId || !currentUserId) {
      console.log("Presence writer skipped:", {
        requestId,
        currentUserId,
      });

      return;
    }

    const presenceRef = doc(
      db,
      "chats",
      String(requestId),
      "presence",
      String(currentUserId),
    );

    const updatePresence = async () => {
      try {
        await setDoc(
          presenceRef,
          {
            userId: String(currentUserId),
            online: true,
            typing: false,
            lastSeen: serverTimestamp(),
          },
          { merge: true },
        );

        console.log("Presence heartbeat:", requestId, currentUserId);
      } catch (error) {
        console.error("Presence update error:", error);
      }
    };

    // Immediately mark user online
    updatePresence();

    // Heartbeat every 15 seconds
    const heartbeat = setInterval(() => {
      updatePresence();
    }, 15000);

    // IMPORTANT:
    // We intentionally do NOT write online:false here.
    //
    // If the user leaves/crashes/closes the browser,
    // the heartbeat stops.
    //
    // useChatPresence.js will automatically consider
    // the user offline when lastSeen is older than 30 sec.

    return () => {
      clearInterval(heartbeat);
    };
  }, [requestId, currentUserId]);
};

export default useChatPresenceWriter;
