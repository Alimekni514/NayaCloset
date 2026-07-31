/**
 * Trouser color-variant asset map.
 *
 * Vite processes these imports at build time so the paths are fingerprinted
 * correctly for production (Cloudflare Pages). The `imageUrl` stored in
 * MongoDB uses the logical key (e.g. "trousers-beige") which this module
 * resolves to the actual hashed asset URL.
 */
import trousersBeigeUrl from '@/assets/trousers-beige.png';
import trousersWhiteUrl from '@/assets/trousers-white.png';
import trousersBlackUrl from '@/assets/trousers-black.png';
import trousersMaronUrl from '@/assets/trousers-maron.png';
import trousersBleucielUrl from '@/assets/trousers-bleuciel.png';
import trousersYellowUrl from '@/assets/trousers-yellow.png';
import trousersRoseUrl from '@/assets/trousers-rose.png';
/**
 * Maps a logical imageUrl key (as stored in MongoDB) to the actual
 * Vite-processed asset URL. Falls back to the raw value if not found
 * (e.g., for products that store an absolute HTTPS URL directly).
 */
export const TROUSER_ASSET_MAP = {
    'trousers-beige': trousersBeigeUrl,
    'trousers-white': trousersWhiteUrl,
    'trousers-black': trousersBlackUrl,
    'trousers-maron': trousersMaronUrl,
    'trousers-bleuciel': trousersBleucielUrl,
    'trousers-yellow': trousersYellowUrl,
    'trousers-rose': trousersRoseUrl,
};
/**
 * Resolve an imageUrl value from the API to an actual asset URL.
 * If the value matches a known key, returns the Vite asset URL.
 * Otherwise returns the value as-is (handles HTTPS URLs or other paths).
 */
export function resolveProductImageUrl(imageUrl) {
    return TROUSER_ASSET_MAP[imageUrl] ?? imageUrl;
}
/**
 * CSS color values for each color variant name.
 * Used to render circular color swatches in the product detail UI.
 */
export const COLOR_SWATCH_CSS = {
    'Beige': '#D4B896',
    'White': '#F5F5F0',
    'Black': '#1A1A1A',
    'Chocolate Brown': '#5C3317',
    'Sky Blue': '#87CEEB',
    'Soft Yellow': '#FADA5E',
    'Dusty Pink': '#D9A3A3',
};
