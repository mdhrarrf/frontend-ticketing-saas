import Link from 'next/link';
import { Ticket } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '48px 16px',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--background)',
      alignItems: 'center'
    }}>

      
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', marginBottom: 32, width: '100%', maxWidth: 400 }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <Ticket size={36} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)' }}>TIXORA</span>
        </Link>
      </div>

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 420 }}>
        <div className="glass-card" style={{ padding: '32px 24px', borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
