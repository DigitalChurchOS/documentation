/* ── Ecclesia Context Provider ──────────────────────── */
import React, { createContext, useContext } from 'react';
import type { SiteContext, ThemeSettings, GlobalContent, NavigationData, FooterData, ModuleEntitlement } from '../../types';

export interface EcclesiaContextValue {
  tenant: SiteContext['tenant'];
  themeSettings: ThemeSettings;
  navigation: NavigationData | null;
  footer: FooterData | null;
  globalContent: GlobalContent | null;
  isPreviewMode: boolean;
  moduleEntitlements?: ModuleEntitlement[];
}

const EcclesiaCtx = createContext<EcclesiaContextValue | null>(null);

export const EcclesiaProvider: React.FC<{ value: EcclesiaContextValue; children: React.ReactNode }> = ({ value, children }) => (
  <EcclesiaCtx.Provider value={value}>{children}</EcclesiaCtx.Provider>
);

export function useEcclesia(): EcclesiaContextValue {
  const ctx = useContext(EcclesiaCtx);
  if (!ctx) throw new Error('useEcclesia must be used within EcclesiaProvider');
  return ctx;
}
