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
  if (typeof fetch === 'function') {
    return fetch(input, init);
  }
  return xhrRequest(input, init);
}
