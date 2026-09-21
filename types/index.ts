import type { ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  id_number?: string;
  avatar?: string;
  avatar_url?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  is_verified: boolean;
  email_verified: boolean;
  status: string;
  roles: string[];
  /** Convenience: first role string e.g. 'user' | 'organizer' | 'super_admin' */
  role?: string;
  organizer?: Organizer;
}

export interface Organizer {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  banner?: string;
  description?: string;
  email: string;
  phone?: string;
  website?: string;
  commission_rate?: number;
  balance?: number;
  status: string;
  is_verified: boolean;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  capacity?: number;
  latitude?: number;
  longitude?: number;
  facilities?: string[];
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  banner?: string;
  description: string;
  full_description?: string;
  category: string;
  tags?: string[];
  event_date: string;
  event_time: string;
  event_end_time?: string;
  venue_id?: string;
  venue_name?: string;
  venue_address?: string;
  venue_city?: string;
  venue?: Venue;
  sale_start_at: string;
  sale_end_at: string;
  is_war_ticket: boolean;
  war_ticket_open_at?: string;
  is_online?: boolean;
  is_featured?: boolean;
  status: string;
  min_price?: number;
  max_price?: number;
  total_capacity: number;
  total_sold: number;
  view_count?: number;
  terms_conditions?: string;
  organizer_id?: string;
  organizer?: Organizer;
  ticketCategories?: TicketCategory[];
  waitingRoom?: WaitingRoom;
}

export interface TicketCategory {
  id: string;
  event_id: string;
  name: string;
  color?: string;
  type: string;
  price: number | string;
  service_fee?: number | string;
  quota: number;
  sold: number;
  reserved: number;
  max_per_user: number;
  sale_start_at?: string;
  sale_end_at?: string;
  entry_gate?: string;
  status: string;
  benefits?: string[] | string;
  restrictions?: string[];
  is_transferable?: boolean;
  requires_id?: boolean;
}

export interface WaitingRoom {
  id: string;
  event_id: string;
  status: string; // 'scheduled' | 'open' | 'processing' | 'closed'
  opens_at: string;
  closes_at?: string;
  total_in_queue: number;
  total_processed: number;
  processing_rate?: number;
}

export interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  discount_amount: number;
  service_fee?: number;
  platform_fee?: number;
  total_amount: number;
  expires_at: string;
  paid_at?: string;
  cancelled_at?: string;
  buyer_data?: Record<string, unknown>;
  event: Event;
  items: OrderItem[];
  payment?: Payment;
  promo_code?: PromoCode;
}

export interface OrderItem {
  id: string;
  ticket_category_id: string;
  quantity: number;
  unit_price: number;
  service_fee: number;
  subtotal: number;
  ticketCategory?: TicketCategory;
  tickets?: Ticket[];
  attendee_data?: AttendeeData[];
}

export interface AttendeeData {
  name: string;
  identity_number?: string;
  phone?: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  holder_name: string;
  holder_email: string;
  holder_phone?: string;
  category?: TicketCategory;
  event_name: string;
  event_date: string;
  event_time?: string;
  venue_name?: string;
  status: string; // 'valid' | 'used' | 'transferred' | 'cancelled' | 'expired'
  qr_url?: string;
  checked_in_at?: string;
  transferred_at?: string;
  metadata?: Record<string, unknown>;
}

export interface QueueStatus {
  queue_token?: string;
  session_token?: string;
  position: number;
  status: string; // 'waiting' | 'in_queue' | 'checkout' | 'ready' | 'expired'
  estimated_minutes?: number;
  total_in_queue: number;
  checkout_token?: string;
  checkout_expires_in?: number;
}

export interface Payment {
  id?: string;
  payment_number?: string;
  status: string;
  amount?: number;
  payment_url?: string;
  va_number?: string;
  qr_code_url?: string;
  gateway: string;
  method?: string;
  channel?: string;
  paid_at?: string;
  payment_expired_at?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  type: string; // 'percent' | 'fixed'
  value: number;
  max_discount?: number;
  min_purchase?: number;
}

export interface PaymentMethod {
  id: string;
  gateway: string;
  type: string; // 'bank_transfer' | 'ewallet' | 'qris' | 'credit_card'
  name: string;
  code: string;
  logo?: ReactNode;
  fee?: number;
  fee_type?: 'fixed' | 'percent';
  min_amount?: number;
  max_amount?: number;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read_at?: string;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ─── Seat Map & Venue Types ──────────────────────────
export interface SeatNode {
  id: number;
  seat_number: string;
  label: string;
  row_id: number;
  row_label: string;
  section_id: number;
  section_name: string;
  section_color: string;
  ticket_category_id?: number | string;
  ticket_category_name?: string;
  price: number;
  service_fee: number;
  status: 'AVAILABLE' | 'LOCKED' | 'SOLD' | 'BLOCKED';
  is_mine: boolean;
  seconds_remaining: number;
  x: number;
  y: number;
}

export interface VenueRowData {
  id: number;
  row_label: string;
  sort_order: number;
  seats: SeatNode[];
}

export interface VenueSectionData {
  id: number;
  name: string;
  code: string;
  color: string;
  capacity: number;
  category_id?: number;
  category_name?: string;
  category_price?: number;
  rows: VenueRowData[];
  seats_count: number;
}

export interface SeatMapData {
  has_seat_map: boolean;
  message?: string;
  venue?: {
    id: number;
    name: string;
    capacity?: number;
    city?: string;
  };
  summary: {
    total: number;
    available: number;
    locked: number;
    sold: number;
    blocked: number;
  };
  sections: VenueSectionData[];
}

export interface SeatLockResult {
  session_id: string;
  locked_seats: {
    seat_id: number;
    label: string;
    seat_number: string;
    row_label: string;
    section_name: string;
    ticket_category_id: number;
    price: number;
    service_fee: number;
  }[];
  subtotal: number;
  service_fee: number;
  total_amount: number;
  expires_at: string;
  seconds_remaining: number;
}

// ─── White-Label Tenant Types ─────────────────────────
export interface TenantBranding {
  id: number | string;
  name: string;
  slug: string;
  custom_domain?: string;
  logo?: string;
  banner?: string;
  favicon?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  portal_title: string;
  portal_tagline?: string;
  portal_settings?: {
    hero_headline?: string;
    contact_email?: string;
    announcement?: string;
    featured_badge?: string;
    [key: string]: any;
  };
  description?: string;
  email?: string;
  social_links?: Record<string, string>;
  is_verified?: boolean;
}
