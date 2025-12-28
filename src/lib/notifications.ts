// Browser Push Notifications Helper

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const showNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  }
  return null;
};

export const sendFollowNotification = (fromUsername: string) => {
  showNotification("New Follower", {
    body: `${fromUsername} started following you`,
    tag: "follow",
  });
};

export const sendLikeNotification = (fromUsername: string, type: "post" | "reel" = "post") => {
  showNotification("New Like", {
    body: `${fromUsername} liked your ${type}`,
    tag: "like",
  });
};

export const sendCommentNotification = (fromUsername: string) => {
  showNotification("New Comment", {
    body: `${fromUsername} commented on your post`,
    tag: "comment",
  });
};
