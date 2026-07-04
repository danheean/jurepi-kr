import type { Place } from './schema';

/**
 * Reliable "open in maps" URL for a place.
 *
 * Authored `link` values are optional and some seed content still carries
 * placeholder URLs (e.g. `.../place/example1`) that don't resolve. So we use an
 * authored link only when it is a real http(s) URL that isn't a placeholder;
 * otherwise we build a NAVER Maps search URL from the place name + address,
 * which always resolves. This guarantees every place has a working maps link.
 */
export function placeMapUrl(
  place: Pick<Place, 'name' | 'address' | 'link'>
): string {
  const link = place.link?.trim();
  if (link && /^https?:\/\//i.test(link) && !/example/i.test(link)) {
    return link;
  }
  const query = `${place.name} ${place.address}`.trim();
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
}
