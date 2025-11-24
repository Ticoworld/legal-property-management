"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, AlertTriangle, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Notification } from "@/server/data/get-notifications";

type NotificationBellProps = {
  initialNotifications: Notification[];
};

export function NotificationBell({ initialNotifications }: NotificationBellProps) {
  const [notifications] = useState<Notification[]>(initialNotifications);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleNotificationClick = (link: string) => {
    setOpen(false);
    router.push(link);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-600 rounded-full"></span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="border-b px-4 py-3">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {notifications.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              You have {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No new notifications
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You&apos;re all caught up!
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.link)}
                  className={cn(
                    "w-full p-4 text-left hover:bg-accent transition-colors flex items-start gap-3",
                    notification.severity === 'CRITICAL' && "bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30"
                  )}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {notification.severity === 'CRITICAL' ? (
                      <Ban className="h-5 w-5 text-red-600 dark:text-red-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-semibold mb-0.5",
                      notification.severity === 'CRITICAL' && "text-red-900 dark:text-red-200"
                    )}>
                      {notification.title}
                    </p>
                    <p className={cn(
                      "text-xs text-muted-foreground line-clamp-2",
                      notification.severity === 'CRITICAL' && "text-red-700 dark:text-red-300"
                    )}>
                      {notification.message}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
