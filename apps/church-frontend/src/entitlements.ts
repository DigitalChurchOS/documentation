import type { ModuleEntitlement } from './types';

type RouteRule = {
  patterns: RegExp[];
  moduleKeys: string[];
};

const ROUTE_RULES: RouteRule[] = [
  { patterns: [/livestream/, /\blive\b/, /watch/], moduleKeys: ['livestream'] },
  { patterns: [/giving/, /\bgive\b/, /partnership/], moduleKeys: ['giving', 'giving-donations'] },
  { patterns: [/volunteer/], moduleKeys: ['volunteer'] },
  { patterns: [/prayer/, /testimon/], moduleKeys: ['prayer'] },
  { patterns: [/event/], moduleKeys: ['events'] },
  { patterns: [/service/], moduleKeys: ['church-services'] },
  { patterns: [/sermon/, /media/], moduleKeys: ['media-sermons', 'media'] },
  { patterns: [/podcast/], moduleKeys: ['podcast'] },
  { patterns: [/library/, /resource/], moduleKeys: ['digital-library-resource-center', 'library'] },
  { patterns: [/course/, /lesson/, /\blms\b/], moduleKeys: ['lms'] },
  { patterns: [/blog/, /article/, /news/], moduleKeys: ['dynamic-blog-publishing-engine', 'blog'] },
  { patterns: [/worship/], moduleKeys: ['worship'] },
  { patterns: [/radio/], moduleKeys: ['radio-broadcasting', 'radio'] },
  { patterns: [/\btv\b/, /television/], moduleKeys: ['tv-broadcasting', 'tv'] },
  { patterns: [/group/, /cell/], moduleKeys: ['groups', 'cell-groups'] },
  { patterns: [/children/, /kids/], moduleKeys: ['children'] },
  { patterns: [/store/, /shop/], moduleKeys: ['store'] },
  { patterns: [/booking/], moduleKeys: ['bookings'] },
  { patterns: [/form/], moduleKeys: ['forms'] },
  { patterns: [/salvation/], moduleKeys: ['salvation'] },
];

const ALWAYS_VISIBLE_PATHS = new Set(['', '/', '/home', '/about', '/contact', '/ministries', '/new-visitor']);

function enabledModuleKeys(entitlements?: ModuleEntitlement[]): Set<string> | null {
  if (!entitlements || entitlements.length === 0) return null;
  return new Set(
    entitlements
      .filter((entitlement) => entitlement.enabled)
      .map((entitlement) => entitlement.moduleKey.toLowerCase())
  );
}

export function requiredModuleKeysForUrl(url: string): string[] {
  const normalized = url.toLowerCase().replace(/\.html(?:$|[?#])/i, '').replace(/\/+$/, '');
  if (ALWAYS_VISIBLE_PATHS.has(normalized)) return [];

  const match = ROUTE_RULES.find((rule) => rule.patterns.some((pattern) => pattern.test(normalized)));
  return match?.moduleKeys || [];
}

export function isUrlEntitled(url: string, entitlements?: ModuleEntitlement[]): boolean {
  const requiredKeys = requiredModuleKeysForUrl(url);
  if (requiredKeys.length === 0) return true;

  const enabledKeys = enabledModuleKeys(entitlements);
  if (!enabledKeys) return true;

  return requiredKeys.some((key) => enabledKeys.has(key.toLowerCase()));
}
