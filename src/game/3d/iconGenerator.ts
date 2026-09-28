// ============================================================
// ICON GENERATOR - Delegated to Centralized Resource Registry
// ============================================================
import { getItemIconUrl } from './resourceRegistry';

/**
 * Retrieve primary resource pack item/block icon URL
 */
export function getItemSprite(itemId: string): string {
  return getItemIconUrl(itemId);
}

/**
 * Fallback handler (delegates to primary icon URL)
 */
export function getItemFallbackSprite(itemId: string): string {
  return getItemIconUrl(itemId);
}
