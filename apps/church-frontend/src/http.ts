type SimpleResponse = Pick<Response, 'ok' | 'status' | 'statusText' | 'text' | 'json'>;

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers.map(([key, value]) => [key, String(value)]));
  }
  return Object.fromEntries(
    Object.entries(headers as Record<string, string>).map(([key, value]) => [key, String(value)])
  );
}

function readStorageValue(key: string): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage?.getItem(key) || '';
  } catch {
    return '';
  }
}

function readOnboardingContext(): Record<string, any> {
  const raw = readStorageValue('churchos.onboardingContext.v1');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function getUrlParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  try {
    return new URL(window.location.href).searchParams;
  } catch {
    return new URLSearchParams();
  }
}

function tenantContextHeaders(input: string): Record<string, string> {
  if (typeof window === 'undefined') return {};

  let requestUrl: URL;
  try {
    requestUrl = new URL(input, window.location.origin);
  } catch {
    return {};
  }

  if (requestUrl.origin !== window.location.origin || !requestUrl.pathname.startsWith('/api/')) {
    return {};
  }

  const context = readOnboardingContext();
  const tenant = (context.tenant || {}) as Record<string, unknown>;
  const params = getUrlParams();
  const tenantId = readStorageValue('churchos.tenantId') || String(tenant.id || '');
  const tenantName =
    params.get('tenantName') ||
    readStorageValue('churchos.tenantName') ||
    String(tenant.name || '');
  const subdomain =
    params.get('subdomain') ||
    readStorageValue('churchos.subdomain') ||
    String(tenant.subdomain || '');

  const headers: Record<string, string> = {};
  if (tenantId) headers['x-tenant-id'] = tenantId;
  if (tenantName) headers['x-tenant-name'] = encodeURIComponent(tenantName);
  if (subdomain) headers['x-tenant-subdomain'] = encodeURIComponent(subdomain);
  if (Object.keys(context).length > 0) {
    headers['x-churchos-onboarding-context'] = encodeURIComponent(JSON.stringify(context));
  }
  return headers;
}

function withTenantContext(input: string, init: RequestInit = {}): RequestInit {
  const contextualHeaders = tenantContextHeaders(input);
  if (!Object.keys(contextualHeaders).length) return init;
  return {
    ...init,
    headers: {
      ...contextualHeaders,
      ...normalizeHeaders(init.headers),
    },
  };
}

function xhrRequest(input: string, init: RequestInit = {}): Promise<SimpleResponse> {
  return new Promise((resolve, reject) => {
    if (typeof XMLHttpRequest === 'undefined') {
      reject(new Error('No browser HTTP client is available'));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open(init.method || 'GET', input, true);
    xhr.withCredentials = init.credentials === 'include';

    const headers = normalizeHeaders(init.headers);
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.onload = () => {
      const status = xhr.status === 1223 ? 204 : xhr.status;
      const text = xhr.responseText || '';
      resolve({
        ok: status >= 200 && status < 300,
        status,
        statusText: xhr.statusText || '',
        text: async () => text,
        json: async () => (text ? JSON.parse(text) : {}),
      });
    };
    xhr.onerror = () => reject(new Error('Network request failed'));
    xhr.ontimeout = () => reject(new Error('Network request timed out'));
    xhr.send(init.body as XMLHttpRequestBodyInit | null | undefined);
  });
}

export async function httpRequest(input: string, init: RequestInit = {}): Promise<SimpleResponse> {
  const requestInit = withTenantContext(input, init);
  if (typeof fetch === 'function') {
    return fetch(input, requestInit);
  }
  return xhrRequest(input, requestInit);
}
