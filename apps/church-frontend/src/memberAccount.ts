import type { Tenant } from './types';
import { httpRequest } from './http';

export interface MemberSession {
  token: string;
  tenantId: string;
  user: {
    id: string;
    email: string;
    member?: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  };
}

export interface MemberAccountResponse {
  member: any;
  giving: {
    donations: any[];
    partnerships: any[];
    recurringGivings: any[];
    recurringPartnerships: any[];
    totalGiven: number;
  };
  settings: Record<string, any>;
}

const SESSION_KEY = 'churchos.memberSession.v1';
export const MEMBER_AUTH_CHANGE_EVENT = 'churchos:member-auth-change';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function loadMemberSession(): MemberSession | null {
  if (!canUseStorage()) return null;
  try {
    const value = window.localStorage.getItem(SESSION_KEY);
    return value ? JSON.parse(value) as MemberSession : null;
  } catch {
    return null;
  }
}

export function saveMemberSession(session: MemberSession): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(MEMBER_AUTH_CHANGE_EVENT));
}

export function clearMemberSession(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(MEMBER_AUTH_CHANGE_EVENT));
}

async function parseJsonResponse(res: Pick<Response, 'text' | 'ok' | 'status'>): Promise<any> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

async function requestWithTenant<T>(
  tenantId: string,
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-tenant-id': tenantId,
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await httpRequest(path, {
    ...options,
    headers,
  });

  const payload = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(payload.error || `Request failed with ${res.status}`);
  }
  return payload as T;
}

export async function loginMember(tenant: Tenant, email: string, password: string): Promise<MemberSession> {
  const payload = await requestWithTenant<{ token: string; user: MemberSession['user'] }>(
    tenant.id,
    '/api/auth/member-login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }
  );

  const session = {
    token: payload.token,
    tenantId: tenant.id,
    user: payload.user,
  };
  saveMemberSession(session);
  return session;
}

export async function registerMember(
  tenant: Tenant,
  body: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }
): Promise<MemberSession> {
  const payload = await requestWithTenant<{ token: string; user: MemberSession['user'] }>(
    tenant.id,
    '/api/auth/member-register',
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );

  const session = {
    token: payload.token,
    tenantId: tenant.id,
    user: payload.user,
  };
  saveMemberSession(session);
  return session;
}

export async function fetchMemberAccount(tenantId: string, token: string): Promise<MemberAccountResponse> {
  const payload = await requestWithTenant<{ data: MemberAccountResponse }>(tenantId, '/api/members/me', {}, token);
  return payload.data;
}

export async function updateMemberProfile(
  tenantId: string,
  token: string,
  body: Record<string, any>
): Promise<any> {
  const payload = await requestWithTenant<{ data: any }>(tenantId, '/api/members/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
  }, token);
  return payload.data;
}

export async function updateMemberPreferences(
  tenantId: string,
  token: string,
  body: Record<string, any>
): Promise<any> {
  const payload = await requestWithTenant<{ data: any }>(tenantId, '/api/members/me/preferences', {
    method: 'PATCH',
    body: JSON.stringify(body),
  }, token);
  return payload.data;
}
