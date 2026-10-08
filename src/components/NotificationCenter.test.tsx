import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  NotificationCenter,
  type Notification,
} from "./NotificationCenter";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("NotificationCenter", () => {
  const notification: Notification = {
    id: 1,
    kind: "success",
    message: "🎊 You win 🎉",
  };

  it("dismisses a notification when its close button is clicked", () => {
    const onDismiss = vi.fn();
    render(
      <NotificationCenter
        notifications={[notification]}
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));

    expect(onDismiss).toHaveBeenCalledWith(notification.id);
  });

  it("shows only the three most recent notifications", () => {
    const notifications = Array.from({ length: 4 }, (_, id) => ({
      ...notification,
      id,
      message: `Notification ${id}`,
    }));

    render(
      <NotificationCenter notifications={notifications} onDismiss={vi.fn()} />
    );

    expect(screen.queryByText("Notification 0")).toBeNull();
    expect(screen.getByText("Notification 1")).toBeTruthy();
    expect(screen.getByText("Notification 2")).toBeTruthy();
    expect(screen.getByText("Notification 3")).toBeTruthy();
  });

  it("dismisses notifications automatically after five seconds", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(
      <NotificationCenter
        notifications={[notification]}
        onDismiss={onDismiss}
      />
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onDismiss).toHaveBeenCalledWith(notification.id);
  });

  it("clears the auto-dismiss timer when a notification is removed", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    const { unmount } = render(
      <NotificationCenter
        notifications={[notification]}
        onDismiss={onDismiss}
      />
    );

    unmount();
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });
});
