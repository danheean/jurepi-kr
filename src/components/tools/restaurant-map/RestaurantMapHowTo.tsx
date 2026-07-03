import { useTranslations } from 'next-intl';

export function RestaurantMapHowTo() {
  const t = useTranslations('tools.restaurant-map');

  return (
    <section className="space-y-6 bg-surface-muted px-4 py-12">
      <div className="max-w-3xl space-y-4">
        <h2 className="text-2xl font-bold text-text">How to Use Restaurant List</h2>
        <div className="space-y-3 text-text-secondary">
          <p>
            Restaurant List is a hand-curated guide to dining by neighborhood and cuisine. Explore themed collections, find places nearby, and save your favorites.
          </p>
          <ul className="space-y-2">
            <li>
              <strong>Browse by region:</strong> Select a city or neighborhood from the tabs to see curated places in that area.
            </li>
            <li>
              <strong>Filter by cuisine:</strong> Narrow down by category (café, Korean, Japanese, etc.) to find exactly what you're craving.
            </li>
            <li>
              <strong>Search:</strong> Type a place name or keyword to find it quickly. Press "/" to focus the search box.
            </li>
            <li>
              <strong>Save favorites:</strong> Click the star icon on any place to pin it for later. Your favorites sync across sessions.
            </li>
            <li>
              <strong>Use geolocation:</strong> Click "내 위치" to see how far each place is from you.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
