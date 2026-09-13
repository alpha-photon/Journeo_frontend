'use client';

import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { COUNTRY_BY_NUM } from '../../data/countries';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Map status → fill colour
const STATUS_COLOR = {
  visited:  '#14b8a6',  // teal-500
  wishlist: '#f59e0b',  // amber-500
  none:     '#1e293b',  // slate-800
  unknown:  '#0f172a',  // slate-900 (country not in our data)
};

export default function WorldMap({ visited, wishlist, onCountryClick }) {
  const visitedSet  = new Set(visited);
  const wishlistSet = new Set(wishlist);

  const getStatus = (numericId) => {
    const country = COUNTRY_BY_NUM[parseInt(numericId)];
    if (!country) return 'unknown';
    if (visitedSet.has(country.a3))  return 'visited';
    if (wishlistSet.has(country.a3)) return 'wishlist';
    return 'none';
  };

  const handleClick = (geo) => {
    if (!onCountryClick) return;
    const country = COUNTRY_BY_NUM[parseInt(geo.id)];
    if (country) onCountryClick(country);
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
      <ComposableMap
        projectionConfig={{ scale: 140, center: [10, 10] }}
        style={{ width: '100%', height: 'auto' }}
      >
        <ZoomableGroup zoom={1} minZoom={1} maxZoom={6}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const status = getStatus(geo.id);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => handleClick(geo)}
                    style={{
                      default: {
                        fill:    STATUS_COLOR[status],
                        stroke:  '#0f172a',
                        strokeWidth: 0.5,
                        outline: 'none',
                        cursor: COUNTRY_BY_NUM[parseInt(geo.id)] ? 'pointer' : 'default',
                        transition: 'fill 0.15s ease',
                      },
                      hover: {
                        fill: status === 'visited'  ? '#0d9488'
                            : status === 'wishlist' ? '#d97706'
                            : status === 'none'     ? '#334155'
                            : '#1e293b',
                        stroke:  '#0f172a',
                        strokeWidth: 0.5,
                        outline: 'none',
                      },
                      pressed: { outline: 'none' },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-800">
        {[
          { color: 'bg-teal-500',  label: 'Visited' },
          { color: 'bg-amber-500', label: 'Wishlist' },
          { color: 'bg-slate-700', label: 'Not yet' },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className={`w-3 h-3 rounded-sm ${l.color}`} />
            {l.label}
          </span>
        ))}
        <span className="ml-auto text-xs text-slate-600">Scroll to zoom · Click a country</span>
      </div>
    </div>
  );
}
