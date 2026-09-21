import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import {
  User, Event, TicketCategory, Order, Ticket,
  QueueStatus, ApiResponse, PaginatedResponse, Payment,
  SeatMapData, SeatLockResult, TenantBranding
} from '../types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // ─── Auth ────────────────────────────────────────
  auth: {
    login:    (data: any) => api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', data).then(r => r.data),
    register: (data: any) => api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data).then(r => r.data),
    logout:   ()          => api.post('/auth/logout').then(r => r.data),
    me:       ()          => api.get<ApiResponse<User>>('/auth/me').then(r => r.data),
    sendOtp:  (data: any) => api.post('/auth/otp/send', data).then(r => r.data),
    verifyOtp:(data: any) => api.post('/auth/otp/verify', data).then(r => r.data),
    getOAuthUrl: (provider: string) => api.get<{url: string}>(`/auth/${provider}/redirect`).then(r => r.data),
    forgotPassword: (data: any) => api.post('/auth/forgot-password', data).then(r => r.data),
    resetPassword: (data: any) => api.post('/auth/reset-password', data).then(r => r.data),
  },

  // ─── Events ──────────────────────────────────────
  events: {
    getEvents:          (params?: any)   => api.get<ApiResponse<PaginatedResponse<Event>>>('/events', { params }).then(r => r.data),
    getEvent:           (slug: string)   => api.get<ApiResponse<Event>>(`/events/${slug}`).then(r => r.data),
    getEventCategories: (slug: string)   => api.get<ApiResponse<TicketCategory[]>>(`/events/${slug}/ticket-categories`).then(r => r.data),
    getEventCountdown:  (slug: string)   => api.get<ApiResponse<{ server_time: string; sale_start_at: string }>>(`/events/${slug}/countdown`).then(r => r.data),
    getWaitingRoomStatus:(slug: string)  => api.get<ApiResponse<any>>(`/events/${slug}/waiting-room`).then(r => r.data),
    toggleWishlist:     (eventId: string)=> api.post<ApiResponse<{ wishlisted: boolean }>>(`/events/${eventId}/wishlist`).then(r => r.data),
  },

  // ─── Queue / Waiting Room ────────────────────────
  queue: {
    joinQueue:        (eventId: string, data: any) => api.post<ApiResponse<QueueStatus>>(`/queue/events/${eventId}/join`, data).then(r => r.data),
    getQueueStatus:   (eventId: string)            => api.get<ApiResponse<QueueStatus>>(`/queue/events/${eventId}/status`).then(r => r.data),
    leaveQueue:       (eventId: string)            => api.delete(`/queue/events/${eventId}/leave`).then(r => r.data),
    getCheckoutToken: (eventId: string)            => api.get<ApiResponse<{ checkout_token: string }>>(`/queue/events/${eventId}/checkout-token`).then(r => r.data),
    publicStatus:     (slug: string)               => api.get<ApiResponse<any>>(`/events/${slug}/waiting-room/status`).then(r => r.data),
  },

  // ─── Orders ──────────────────────────────────────
  orders: {
    getOrders:   (params?: any)        => api.get<ApiResponse<PaginatedResponse<Order>>>('/orders', { params }).then(r => r.data),
    createOrder: (data: any)           => api.post<ApiResponse<Order>>('/orders', data).then(r => r.data),
    getOrder:    (orderNumber: string) => api.get<ApiResponse<Order>>(`/orders/${orderNumber}`).then(r => r.data),
    cancelOrder: (orderNumber: string) => api.post(`/orders/${orderNumber}/cancel`).then(r => r.data),
    applyPromo:  (orderNumber: string, code: string) =>
      api.post<ApiResponse<{ order: Order; discount_amount: number; total_amount: number }>>(`/orders/${orderNumber}/apply-promo`, { promo_code: code }).then(r => r.data),
    validatePromo: (data: any) =>
      api.post<ApiResponse<{ discount: number }>>('/orders/validate-promo', data).then(r => r.data),
  },

  // ─── Payments ────────────────────────────────────
  payments: {
    createPayment:   (orderNumber: string, data: any) => api.post<ApiResponse<Payment>>(`/payments/orders/${orderNumber}`, data).then(r => r.data),
    getPaymentStatus:(orderNumber: string)             => api.get<ApiResponse<Payment>>(`/payments/orders/${orderNumber}/status`).then(r => r.data),
    checkPayment:    (paymentNumber: string)           => api.post<ApiResponse<Payment>>(`/payments/${paymentNumber}/check`, {}).then(r => r.data),
  },

  // ─── Tickets ─────────────────────────────────────
  tickets: {
    getTickets:     (params?: any)         => api.get<ApiResponse<PaginatedResponse<Ticket>>>('/tickets', { params }).then(r => r.data),
    getTicket:      (ticketNumber: string) => api.get<ApiResponse<Ticket>>(`/tickets/${ticketNumber}`).then(r => r.data),
    getDynamicToken:(ticketNumber: string) => api.get<ApiResponse<{
      ticket_number: string;
      event_id: number;
      token: string;
      expires_at: number;
      server_time: number;
      rotation_interval: number;
      seconds_remaining: number;
      holder_name: string;
    }>>(`/tickets/${ticketNumber}/dynamic-token`).then(r => r.data),
    downloadTicket: (ticketNumber: string) => api.get(`/tickets/${ticketNumber}/download`, { responseType: 'blob' }),
    transferTicket: (ticketNumber: string, data: { email: string }) => api.post(`/tickets/${ticketNumber}/transfer`, data).then(r => r.data),
  },

  // ─── User Profile ────────────────────────────────
  user: {
    getProfile:          ()         => api.get<ApiResponse<User>>('/user/profile').then(r => r.data),
    updateProfile:       (data: any)=> api.put<ApiResponse<User>>('/user/profile', data).then(r => r.data),
    changePassword:      (data: any)=> api.put('/user/password', data).then(r => r.data),
    uploadAvatar:        (file: File) => {
      const fd = new FormData(); fd.append('avatar', file);
      return api.post<ApiResponse<{ avatar_url: string }>>('/user/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
    },
    getNotifications:    (params?: any) => api.get<ApiResponse<PaginatedResponse<any>>>('/user/notifications', { params }).then(r => r.data),
    markNotificationRead:(id: string)   => api.post(`/user/notifications/${id}/read`).then(r => r.data),
    markAllRead:         ()             => api.post('/user/notifications/read-all').then(r => r.data),
    getWishlist:         ()             => api.get<ApiResponse<Event[]>>('/user/wishlists').then(r => r.data),
  },

  // ─── Organizer ───────────────────────────────────
  organizer: {
    getProfile:    ()            => api.get<ApiResponse<any>>('/organizer/profile').then(r => r.data),
    updateProfile: (data: any)   => api.put<ApiResponse<any>>('/organizer/profile', data).then(r => r.data),
    register:      (data: any)   => api.post<ApiResponse<any>>('/organizer/register', data).then(r => r.data),
    getOverview:   (params?: any)=> api.get<ApiResponse<any>>('/organizer/analytics/overview', { params }).then(r => r.data),
    getEvents:     (params?: any)=> api.get<ApiResponse<PaginatedResponse<Event>>>('/organizer/events', { params }).then(r => r.data),
    createEvent:   (data: any)   => api.post<ApiResponse<Event>>('/organizer/events', data).then(r => r.data),
    updateEvent:   (id: string, data: any) => api.put<ApiResponse<Event>>(`/organizer/events/${id}`, data).then(r => r.data),
    publishEvent:  (id: string)  => api.post(`/organizer/events/${id}/publish`).then(r => r.data),
    deleteEvent:   (id: string)  => api.delete(`/organizer/events/${id}`).then(r => r.data),
    getAnalytics:  (params?: any)=> api.get<ApiResponse<any>>('/organizer/analytics/overview', { params }).then(r => r.data),
    getRevenue:    (params?: any)=> api.get<ApiResponse<any>>('/organizer/analytics/revenue', { params }).then(r => r.data),
    checkIn:       (data: { qr_code?: string; token?: string; event_id: string | number; gate?: string }) =>
      api.post<ApiResponse<any>>('/scanner/check-in', data).then(r => r.data),
    validateTicket:(data: { qr_code?: string; token?: string; event_id: string | number; gate?: string }) =>
      api.post<ApiResponse<any>>('/scanner/validate', data).then(r => r.data),
    getCheckInStats:(eventId: string | number) => api.get<ApiResponse<any>>(`/scanner/events/${eventId}/stats`).then(r => r.data),
    getRecentScans:(eventId: string | number) => api.get<ApiResponse<any>>(`/scanner/events/${eventId}/recent`).then(r => r.data),
    getPayouts:    (params?: any)=> api.get<ApiResponse<any>>('/organizer/payouts', { params }).then(r => r.data),
    requestPayout: (data: any)   => api.post('/organizer/payouts/request', data).then(r => r.data),
    getBalance:    ()            => api.get<ApiResponse<any>>('/organizer/balance').then(r => r.data),
    getQueueStats: ()            => api.get<ApiResponse<any>>('/organizer/analytics/queue-stats').then(r => r.data),
    getPromoCodes: (params?: any)=> api.get<ApiResponse<any>>('/organizer/promo-codes', { params }).then(r => r.data),
    createPromoCode:(data: any)  => api.post('/organizer/promo-codes', data).then(r => r.data),
  },

  // ─── Admin ───────────────────────────────────────
  admin: {
    getStats:          ()            => api.get<ApiResponse<any>>('/admin/stats').then(r => r.data),
    getUsers:          (params?: any)=> api.get<ApiResponse<any>>('/admin/users', { params }).then(r => r.data),
    getOrganizers:     (params?: any)=> api.get<ApiResponse<any>>('/admin/organizers', { params }).then(r => r.data),
    approveOrganizer:  (id: string)  => api.post(`/admin/organizers/${id}/approve`).then(r => r.data),
    rejectOrganizer:   (id: string, data: any) => api.post(`/admin/organizers/${id}/reject`, data).then(r => r.data),
    suspendOrganizer:  (id: string, reason: string) => api.post(`/admin/organizers/${id}/suspend`, { reason }).then(r => r.data),
    getEvents:         (params?: any)=> api.get<ApiResponse<any>>('/admin/events', { params }).then(r => r.data),
    approveEvent:      (id: string)  => api.post(`/admin/events/${id}/approve`).then(r => r.data),
    rejectEvent:       (id: string, reason: string) => api.post(`/admin/events/${id}/reject`, { reason }).then(r => r.data),
    suspendEvent:      (id: string)  => api.post(`/admin/events/${id}/suspend`).then(r => r.data),
    featureEvent:      (id: string)  => api.post(`/admin/events/${id}/feature`).then(r => r.data),
    getOrders:         (params?: any)=> api.get<ApiResponse<any>>('/admin/orders', { params }).then(r => r.data),
    getQueueMonitor:   ()            => api.get<ApiResponse<any>>('/admin/queue-monitor').then(r => r.data),
    getSystemSettings: ()            => api.get<ApiResponse<any>>('/admin/settings').then(r => r.data),
    updateSetting:     (key: string, value: any) => api.put(`/admin/settings/${key}`, { value }).then(r => r.data),
  },

  // ─── Venues (public) ─────────────────────────────
  venues: {
    getVenues: (params?: any) => api.get<ApiResponse<any[]>>('/venues', { params }).then(r => r.data),
  },

  // ─── FestPay Cashless Ecosystem ─────────────────
  festpay: {
    getWallets: () => api.get<ApiResponse<any[]>>('/festpay/wallets').then(r => r.data),
    getOrCreateWallet: (eventId: number | string) => api.post<ApiResponse<any>>('/festpay/wallets/get-or-create', { event_id: eventId }).then(r => r.data),
    getWallet: (walletId: number | string) => api.get<ApiResponse<any>>(`/festpay/wallets/${walletId}`).then(r => r.data),
    getPaymentQr: (walletId: number | string) => api.get<ApiResponse<any>>(`/festpay/wallets/${walletId}/qr`).then(r => r.data),
    topUpWallet: (walletId: number | string, data: { amount: number; payment_method?: string }) =>
      api.post<ApiResponse<any>>(`/festpay/wallets/${walletId}/topup`, data).then(r => r.data),
    requestRefund: (walletId: number | string, data: { amount: number; bank_name: string; account_number: string; account_name: string }) =>
      api.post<ApiResponse<any>>(`/festpay/wallets/${walletId}/refund`, data).then(r => r.data),
    getTransactions: (walletId: number | string, params?: any) =>
      api.get<ApiResponse<any>>(`/festpay/wallets/${walletId}/transactions`, { params }).then(r => r.data),
    pairWristband: (data: { event_id: number | string; raw_uid: string; wallet_id: number | string }) =>
      api.post<ApiResponse<any>>('/festpay/wristbands/pair', data).then(r => r.data),
    reportLostWristband: (wristbandId: number | string) =>
      api.post<ApiResponse<any>>(`/festpay/wristbands/${wristbandId}/report-lost`).then(r => r.data),
    getBooths: (params?: any) => api.get<ApiResponse<any[]>>('/festpay/booths', { params }).then(r => r.data),
    createBooth: (data: any) => api.post<ApiResponse<any>>('/festpay/booths', data).then(r => r.data),
    getBooth: (boothId: number | string) => api.get<ApiResponse<any>>(`/festpay/booths/${boothId}`).then(r => r.data),
    addProduct: (boothId: number | string, data: any) => api.post<ApiResponse<any>>(`/festpay/booths/${boothId}/products`, data).then(r => r.data),
    updateProduct: (boothId: number | string, productId: number | string, data: any) =>
      api.put<ApiResponse<any>>(`/festpay/booths/${boothId}/products/${productId}`, data).then(r => r.data),
    boothPay: (boothId: number | string, data: { items: { product_id: number; quantity: number }[]; payment_method: 'QR_WALLET' | 'NFC_WRISTBAND'; credential: string }, idempotencyKey?: string) =>
      api.post<ApiResponse<any>>(`/festpay/booths/${boothId}/pay`, data, {
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined
      }).then(r => r.data),
    getBoothTransactions: (boothId: number | string, params?: any) =>
      api.get<ApiResponse<any>>(`/festpay/booths/${boothId}/transactions`, { params }).then(r => r.data),
  },

  // ─── Seat Map Engine ──────────────────────────────
  seatMap: {
    getSeatMap: (slug: string, sessionId?: string) =>
      api.get<ApiResponse<SeatMapData>>(`/events/${slug}/seats`, {
        params: sessionId ? { session_id: sessionId } : undefined,
        headers: sessionId ? { 'X-Session-ID': sessionId } : undefined,
      }).then(r => r.data),
    lockSeats: (slug: string, seatIds: number[], sessionId: string) =>
      api.post<ApiResponse<SeatLockResult>>(`/events/${slug}/seats/lock`, {
        seat_ids: seatIds,
        session_id: sessionId,
      }, {
        headers: { 'X-Session-ID': sessionId }
      }).then(r => r.data),
    releaseSeats: (slug: string, seatIds: number[], sessionId: string) =>
      api.post<ApiResponse<any>>(`/events/${slug}/seats/release`, {
        seat_ids: seatIds,
        session_id: sessionId,
      }, {
        headers: { 'X-Session-ID': sessionId }
      }).then(r => r.data),
    getVenueSections: (venueId: number | string) =>
      api.get<ApiResponse<any>>(`/organizer/venues/${venueId}/sections`).then(r => r.data),
    createVenueSection: (venueId: number | string, data: any) =>
      api.post<ApiResponse<any>>(`/organizer/venues/${venueId}/sections`, data).then(r => r.data),
    generateSeats: (venueId: number | string, data: any) =>
      api.post<ApiResponse<any>>(`/organizer/venues/${venueId}/generate-seats`, data).then(r => r.data),
    updateSeat: (venueId: number | string, seatId: number | string, data: any) =>
      api.put<ApiResponse<any>>(`/organizer/venues/${venueId}/seats/${seatId}`, data).then(r => r.data),
  },

  // ─── Multi-Tenant White-Label ─────────────────────
  tenant: {
    getBranding: (slug: string) =>
      api.get<ApiResponse<TenantBranding>>(`/tenants/${slug}`).then(r => r.data),
    getEvents: (slug: string, params?: any) =>
      api.get<ApiResponse<PaginatedResponse<Event>>>(`/tenants/${slug}/events`, { params }).then(r => r.data),
    updateBranding: (data: Partial<TenantBranding>) =>
      api.put<ApiResponse<TenantBranding>>('/organizer/branding', data).then(r => r.data),
  },

  // ─── War Room & Observability ─────────────────────
  warRoom: {
    getTelemetry: () =>
      api.get<ApiResponse<any>>('/war-room/telemetry').then(r => r.data),
  },

  // ─── Organizer Application & Event Activation ─────
  organizerApplication: {
    getPackages: () =>
      api.get<ApiResponse<any>>('/organizer-applications/packages').then(r => r.data),
    checkout: (data: any) =>
      api.post<ApiResponse<any>>('/organizer-applications/checkout', data).then(r => r.data),
    get: (invoiceNumber: string) =>
      api.get<ApiResponse<any>>(`/organizer-applications/${invoiceNumber}`).then(r => r.data),
    confirmPayment: (invoiceNumber: string, data: { organizer_email: string; organizer_name?: string; password?: string }) =>
      api.post<ApiResponse<any>>(`/organizer-applications/${invoiceNumber}/confirm-payment`, data).then(r => r.data),
  },
};

export default api;
