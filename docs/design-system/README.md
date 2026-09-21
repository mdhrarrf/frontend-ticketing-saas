# TIXORA — Frontend Design System & Component Architecture

> **"Build once, reuse everywhere."**
> Dokumen ini adalah panduan resmi (Single Source of Truth) untuk seluruh developer dan AI coding agents yang mengembangkan frontend platform TIXORA.

---

## 1. Fondasi Arsitektur

Frontend TIXORA dibangun dengan arsitektur 4 lapis yang modular, type-safe, dan konsisten:

```text
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Feature / Page Views                           │
│ (Public, Buyer, Organizer, Scanner, FestPay, Admin)     │
├─────────────────────────────────────────────────────────┤
│ Layer 2: Domain Components                              │
│ (EventCard, StatCard, EventStatusBadge, TicketStatusBadge)│
├─────────────────────────────────────────────────────────┤
│ Layer 1: Layout Components                              │
│ (PageContainer, PageHeader, Section)                    │
├─────────────────────────────────────────────────────────┤
│ Layer 0: Primitive UI Components & Design Tokens         │
│ (Button, Card, Badge, Input, FormField, Modal, Toast)   │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Design Tokens (`app/globals.css`)

Semua token warna didefinisikan menggunakan CSS Custom Properties pada `:root` dan dihubungkan ke `@theme` Tailwind CSS v4.

### 🎨 Color Palette

| Token | Hex | Tailwind Class | Penggunaan |
|---|---|---|---|
| **Primary** | `#7C3AED` | `bg-primary`, `text-primary` | Brand identity, tombol aksi utama, link aktif |
| **Primary Dark** | `#5B21B6` | `bg-primary-dark` | Hover states pada tombol utama |
| **Primary Light** | `#8B5CF6` | `text-primary-light` | Highlight text, gradient accent |
| **Secondary** | `#4F46E5` | `bg-secondary` | Tombol sekunder, border highlight |
| **Accent / Cyan** | `#22D3EE` | `bg-accent`, `text-accent` | Cyber glow, tag info, highlight data |
| **Background** | `#0B1020` | `bg-background` | Background dasar aplikasi (dark mode) |
| **Surface** | `#111827` | `bg-surface` | Background container, navbar, input background |
| **Surface Elevated** | `#1F2937` | `bg-surface-elevated` | Modal dialog, hover card, dropdown |
| **Card** | `#172033` | `bg-card` | Container kartu event, card tiket, widget |
| **Border** | `#1E293B` | `border-border` | Border standar |
| **Border Bright** | `#334155` | `border-border-bright` | Border aktif / focus ring |

### 🚦 Semantic Status Colors

| Status | Hex | Class |
|---|---|---|
| **Success** | `#10B981` | `text-success`, `bg-success/15` |
| **Warning** | `#F59E0B` | `text-warning`, `bg-warning/15` |
| **Danger** | `#EF4444` | `text-danger`, `bg-danger/15` |
| **War Ticket** | Gradient Red/Orange | `Badge variant="warTicket"` |

### 📐 Corner Radius & Spacing

* `rounded-sm`: `6px`
* `rounded-md`: `10px`
* `rounded-lg`: `14px`
* `rounded-xl`: `20px`
* `rounded-2xl`: `24px`
* `rounded-full`: `9999px`

---

## 3. Katalog Komponen

### A. Primitive UI (`components/ui/`)

Semua primitive di-export melalui barrel `@/components/ui`:

1. **`Button`**
   ```tsx
   import { Button } from '@/components/ui';

   <Button variant="primary" size="md" loading={isSubmitting} leftIcon={<Plus />}>
     Buat Event
   </Button>
   ```
   * *Variants*: `'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent' | 'link'`
   * *Sizes*: `'sm' | 'md' | 'lg'`
   * *Props*: `loading`, `disabled`, `leftIcon`, `rightIcon`, `fullWidth`

2. **`Card`**
   ```tsx
   import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

   <Card variant="interactive" className="p-5">
     <CardTitle>Ringkasan Penjualan</CardTitle>
     <CardContent>...</CardContent>
   </Card>
   ```
   * *Variants*: `'default' | 'elevated' | 'bordered' | 'interactive' | 'glass'`

3. **`Badge`**
   ```tsx
   import { Badge } from '@/components/ui';

   <Badge variant="success" size="sm">Lunas</Badge>
   <Badge variant="warTicket">WAR TICKET</Badge>
   ```

4. **`FormField` & `Input` & `Textarea`**
   ```tsx
   import { FormField, Input } from '@/components/ui';

   <FormField label="Email" required hint="Gunakan email aktif Anda" error={errors.email}>
     <Input type="email" placeholder="nama@email.com" />
   </FormField>
   ```

5. **`Modal`**
   ```tsx
   import { Modal } from '@/components/ui';

   <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Konfirmasi Refund">
     Konten modal di sini...
   </Modal>
   ```

6. **`Toast` Provider & Helper**
   ```tsx
   import { toast } from '@/components/ui';

   toast.success('Tiket berhasil dipesan!');
   toast.error('Gagal memproses transaksi.');
   ```

7. **Standard State Handlers**
   * `<LoadingState message="..." />`: Loading state seragam dengan spinner atau skeleton.
   * `<EmptyState title="..." description="..." action={<Button .../>} />`: Empty state seragam.
   * `<ErrorState title="..." description="..." onRetry={...} />`: Error state dengan tombol coba lagi.

---

### B. Layout Components (`components/layout/`)

1. **`PageContainer`**
   * Menjamin gutter horizontal (`px-4 sm:px-6 lg:px-8`) dan max-width yang konsisten.
   * Sizes: `'sm' (max-w-3xl) | 'md' (max-w-5xl) | 'lg' (max-w-7xl) | 'full'`
2. **`PageHeader`**
   * Header halaman standar dengan judul, deskripsi, breadcrumbs, badge, dan slot CTA action.
3. **`Section`**
   * Wrapper section vertikal dengan varian padding (`'none' | 'sm' | 'md' | 'lg' | 'xl'`) dan background.

---

### C. Domain Components (`components/...`)

1. **`EventStatusBadge`** (`components/event/EventStatusBadge.tsx`)
   * Menampilkan status event (`draft`, `published`, `on_sale`, `cancelled`, `ended`, `sold_out`).
2. **`TicketStatusBadge`** (`components/ticket/TicketStatusBadge.tsx`)
   * Menampilkan status transaksi/tiket (`paid`, `waiting_payment`, `pending`, `cancelled`, `used`, `expired`).
3. **`StatCard`** (`components/organizer/StatCard.tsx`)
   * KPI Card seragam untuk dashboard organizer & admin, mendukung icon container, trend up/down, dan shimmer loading state.
4. **`EventCard`** (`components/events/EventCard.tsx`)
   * Kartu konser & festival dengan dynamic banner, status stock, badge war ticket, dan layout interaktif.

---

## 4. Aturan Wajib untuk Developer & AI Agents

1. **DILARANG MENGGUNAKAN HARD-CODED HEX COLOR DI INLINE STYLE**:
   ❌ `style={{ background: '#6366F1', color: '#10B981' }}`
   ✅ Gunakan class Tailwind: `className="bg-primary text-success"` atau CSS custom properties `var(--color-primary)`.
2. **DILARANG MEMBUAT TOMBOL ATAU CARD KUSTOM BARU**:
   ❌ `<button style={{ padding: '10px 20px', borderRadius: 10, background: 'blue' }}>`
   ✅ `<Button variant="primary" size="md">`
3. **DILARANG MEMBUAT STATUS MAP BARU SECARA AD-HOC**:
   ❌ Mendefinisikan object `const STATUS_MAP = { paid: { ... } }` di setiap halaman baru.
   ✅ Import dan gunakan `<TicketStatusBadge status={order.status} />` atau `<EventStatusBadge status={event.status} />`.
4. **DILARANG MENGABAIKAN STATE FEEDBACK**:
   * Setiap halaman data asynchronous WAJIB menangani 4 state: **Loading** (`LoadingState`), **Error** (`ErrorState`), **Empty** (`EmptyState`), dan **Success**.
5. **DUKUNGAN WHITE-LABEL**:
   * Jangan pernah menimpa selector root yang merusak `TenantThemeProvider`. CSS variable `--color-primary` dan `--color-secondary` harus tetap dinamis agar tenant portal dapat mengubah tema secara mulus.
