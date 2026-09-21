'use client';

import React, { useEffect } from 'react';
import type { TenantBranding } from '@/types';

interface TenantThemeProviderProps {
  branding?: TenantBranding | null;
  children: React.ReactNode;
}

export function TenantThemeProvider({ branding, children }: TenantThemeProviderProps) {
  useEffect(() => {
    if (!branding) return;

    // Apply custom CSS variables
    const root = document.documentElement;
    if (branding.primary_color) {
      root.style.setProperty('--tenant-primary', branding.primary_color);
      root.style.setProperty('--color-primary', branding.primary_color);
    }
    if (branding.secondary_color) {
      root.style.setProperty('--tenant-secondary', branding.secondary_color);
      root.style.setProperty('--color-secondary', branding.secondary_color);
    }
    if (branding.accent_color) {
      root.style.setProperty('--tenant-accent', branding.accent_color);
    }

    // Dynamic document title
    if (branding.portal_title) {
      document.title = `${branding.portal_title} | TIXORA White-Label`;
    }

    // Dynamic favicon if provided
    if (branding.favicon) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = branding.favicon;
    }

    return () => {
      // Reset variables on unmount
      root.style.removeProperty('--tenant-primary');
      root.style.removeProperty('--tenant-secondary');
      root.style.removeProperty('--tenant-accent');
    };
  }, [branding]);

  return <>{children}</>;
}
