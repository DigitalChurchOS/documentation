/* ── API layer for CMS data fetching ────────────────── */
import type { SiteContext, PageRenderResponse } from './types';

export async function fetchSiteContext(): Promise<{ data: SiteContext }> {
  const res = await fetch('/api/cms/site-context');
  if (!res.ok) throw new Error(`Failed to fetch site context: ${res.statusText}`);
  return res.json();
}

export async function fetchPageRender(slug: string): Promise<PageRenderResponse> {
  const res = await fetch(`/api/cms/render?slug=${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error(`Failed to fetch page ${slug}: ${res.statusText}`);
  return res.json();
}

export async function fetchPreviewPage(slug: string, token: string): Promise<PageRenderResponse> {
  const res = await fetch(`/api/cms/render?slug=${encodeURIComponent(slug)}&previewToken=${encodeURIComponent(token)}`);
  if (!res.ok) throw new Error(`Failed to fetch preview page ${slug}: ${res.statusText}`);
  return res.json();
}
