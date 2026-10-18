import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck } from "lucide-react";
import { supabase } from "@/services/supabase";
import { Card, LoadingState, EmptyState, Button } from "@/components/ui";
import { formatDate } from "@/utils/constants";
import type { Notification } from "@/types";

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["my-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Notification[];
    },
  });

  async function markAsRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
  }

  async function markAllRead() {
    if (!notifications) return;
    const unread = notifications.filter((n) => !n.is_read);
    await Promise.all(unread.map((n) => supabase.from("notifications").update({ is_read: true }).eq("id", n.id)));
    queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
  }

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-500" /> Notifications
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingState message="Loading notifications..." />
      ) : !notifications || notifications.length === 0 ? (
        <Card className="p-6">
          <EmptyState icon={<Bell className="w-12 h-12" />} title="No notifications" message="You'll see updates about your complaints here." />
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={`p-4 ${!n.is_read ? "border-brand-200 bg-brand-50/30" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-navy-800">{n.title}</p>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-brand-500" />}
                  </div>
                  <p className="text-sm text-gray-600">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="text-gray-400 hover:text-brand-600 transition flex-shrink-0"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
