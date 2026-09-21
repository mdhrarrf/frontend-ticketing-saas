'use client';

// This layout is intentionally minimal.
// The actual sidebar + auth guard is handled by app/(user)/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
