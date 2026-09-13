'use client';

const buildLinks = (destination) => {
  const enc   = encodeURIComponent(destination);
  const plain = destination.replace(/\s+/g, '+');

  return [
    { name: 'TripAdvisor',    icon: '🦉', description: 'Hotels, restaurants & attractions reviews', url: `https://www.tripadvisor.com/Search?q=${enc}`,                             badge: 'Reviews',    accent: 'border-jade/30 hover:border-jade/60',       badgeCls: 'bg-jade-subtle text-jade' },
    { name: 'Lonely Planet',  icon: '📖', description: 'Trusted travel guides & local tips',        url: `https://www.lonelyplanet.com/search?q=${enc}`,                           badge: 'Guides',     accent: 'border-indigo/30 hover:border-indigo/60',   badgeCls: 'bg-indigo-subtle text-indigo' },
    { name: 'Google Maps',    icon: '🗺️', description: 'Navigate & explore the destination',        url: `https://www.google.com/maps/search/${enc}`,                              badge: 'Navigation', accent: 'border-rose/30 hover:border-rose/60',        badgeCls: 'bg-rose-subtle text-rose' },
    { name: 'Booking.com',    icon: '🏨', description: 'Hotels, apartments & stays',                url: `https://www.booking.com/search.html?ss=${enc}`,                          badge: 'Hotels',     accent: 'border-indigo/30 hover:border-indigo/60',   badgeCls: 'bg-indigo-subtle text-indigo' },
    { name: 'Viator',         icon: '🎯', description: 'Tours, activities & experiences',           url: `https://www.viator.com/search/${plain}`,                                 badge: 'Activities', accent: 'border-saffron/30 hover:border-saffron/60', badgeCls: 'bg-saffron-subtle text-saffron-deep' },
    { name: 'Skyscanner',     icon: '✈️', description: 'Find the best flight deals',               url: `https://www.skyscanner.com/transport/flights/anywhere/${enc}/`,           badge: 'Flights',    accent: 'border-jade/30 hover:border-jade/60',       badgeCls: 'bg-jade-subtle text-jade' },
    { name: 'Airbnb',         icon: '🏡', description: 'Unique homes & local experiences',          url: `https://www.airbnb.com/s/${enc}/homes`,                                  badge: 'Stays',      accent: 'border-rose/30 hover:border-rose/60',        badgeCls: 'bg-rose-subtle text-rose' },
    { name: 'Google Flights', icon: '🛫', description: 'Compare flight prices & routes',            url: `https://www.google.com/flights?q=flights+to+${enc}`,                    badge: 'Flights',    accent: 'border-marigold/30 hover:border-marigold/60',badgeCls: 'bg-marigold-subtle text-marigold-deep' },
    { name: 'Rome2Rio',       icon: '🚂', description: 'Compare transport options',                  url: `https://www.rome2rio.com/s/${enc}`,                                      badge: 'Transport',  accent: 'border-marigold/30 hover:border-marigold/60',badgeCls: 'bg-marigold-subtle text-marigold-deep' },
  ];
};

export default function WebRecommendations({ destination }) {
  const links = buildLinks(destination);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <p className="eyebrow mb-1">External links</p>
        <h2 className="font-serif text-2xl font-semibold text-ink">Curated Resources</h2>
        <p className="text-sm text-ink-muted mt-1">
          Hand-picked travel resources for{' '}
          <span className="text-saffron font-medium">{destination}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((link) => (
          <div
            key={link.name}
            className={`group relative bg-white border ${link.accent} rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-warm-md shadow-warm-sm`}
          >
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 rounded-2xl"
              aria-label={`Open ${link.name}`}
            />
            <div className="relative flex items-start justify-between mb-3">
              <div className="text-3xl">{link.icon}</div>
              <span className={`text-xs font-mono font-medium px-2.5 py-0.5 rounded-full border ${link.badgeCls} border-transparent`}>
                {link.badge}
              </span>
            </div>
            <h3 className="relative font-semibold text-ink mb-1">{link.name}</h3>
            <p className="relative text-sm text-ink-muted leading-relaxed mb-3">{link.description}</p>
            <div className="relative flex items-center gap-1 text-xs text-ink-muted group-hover:text-saffron transition-colors font-mono tracking-wider">
              <span>OPEN →</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pro tip */}
      <div className="mt-8 bg-saffron-subtle border border-saffron/20 rounded-2xl p-5 flex gap-4">
        <span className="text-2xl shrink-0">💡</span>
        <div>
          <h4 className="font-semibold text-saffron-deep mb-1 font-sans">Pro Booking Tip</h4>
          <p className="text-sm text-ink-soft leading-relaxed">
            Book accommodations on Booking.com or Airbnb first, then use Viator for day tours. For flights, compare
            Google Flights with Skyscanner for the best deals. Always check TripAdvisor reviews before booking restaurants.
          </p>
        </div>
      </div>
    </div>
  );
}
