import { api } from "@/shared/lib/http/api";

export const notificationsService = {
  async list() {
    const res = await api.get("/notifications", { params: { page: 1, limit: 8 } });
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },
  async unreadCount() {
    const res = await api.get("/notifications/unread-count");
    return Number(res.data?.count ?? 0);
  },
  async markRead(id: string) {
    const res = await api.patch(`/notifications/${id}/read`, {});
    return res.data;
  },
  async markAllRead() {
    await api.post("/notifications/read-all", {});
  },
  async remove(id: string) {
    await api.delete(`/notifications/${id}`);
  },
};
