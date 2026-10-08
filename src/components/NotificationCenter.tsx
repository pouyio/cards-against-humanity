import { useEffect } from "react";
import "./NotificationCenter.css";

export type NotificationKind = "success" | "info";

export type Notification = {
  id: number;
  kind: NotificationKind;
  message: string;
};

type NotificationCenterProps = {
  notifications: Notification[];
  onDismiss: (id: number) => void;
};

const NotificationItem: React.FC<{
  notification: Notification;
  onDismiss: (id: number) => void;
}> = ({ notification, onDismiss }) => {
  useEffect(() => {
    const timeout = window.setTimeout(
      () => onDismiss(notification.id),
      5000
    );
    return () => window.clearTimeout(timeout);
  }, [notification.id, onDismiss]);

  return (
    <div
      className={`notification notification-${notification.kind}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span>{notification.message}</span>
      <button
        className="notification-dismiss"
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(notification.id)}
      >
        ×
      </button>
    </div>
  );
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onDismiss,
}) => (
  <div className="notification-center" aria-label="Notifications">
    {notifications.slice(-3).map((notification) => (
      <NotificationItem
        key={notification.id}
        notification={notification}
        onDismiss={onDismiss}
      />
    ))}
  </div>
);
