'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF, PolylineF } from '@react-google-maps/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

const SLOT_COLORS = {
  morning:   { marker: '#f59e0b', line: '#f59e0b' }, // amber
  afternoon: { marker: '#0ea5e9', line: '#0ea5e9' }, // sky
  evening:   { marker: '#8b5cf6', line: '#8b5cf6' }, // violet
};

const CAT_ICONS = {
  attraction: '🏛️',
  nature:     '🌿',
  activity:   '🎯',
  food:       '🍽️',
  viewpoint:  '🌄',
  transport:  '🚌',
  nightlife:  '🌃',
};

const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c4a6e' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

const MAP_OPTIONS = {
  styles: MAP_STYLES,
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

export default function TripMap({ shareId, activeDay, highlightedActivity, onMarkerClick }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
  });

  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeInfo, setActiveInfo] = useState(null); // activityKey of open InfoWindow
  const mapRef = useRef(null);

  // Fetch coordinates
  useEffect(() => {
    if (!shareId) return;
    fetch(`${API_URL}/api/itinerary/${shareId}/coordinates`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setDays(data.days || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [shareId]);

  // Build flat list of activities with coordinates for active day
  const activities = [];
  const day = activeDay === 'all'
    ? null
    : days.find((d) => d.day === parseInt(activeDay));

  const sourceDays = day ? [day] : days;
  for (const d of sourceDays) {
    for (const slot of ['morning', 'afternoon', 'evening']) {
      (d[slot] || []).forEach((act, idx) => {
        if (act.lat != null && act.lng != null) {
          const key = `${d.day}-${slot}-${idx}`;
          activities.push({ ...act, slot, dayNum: d.day, key });
        }
      });
    }
  }

  // Center map on activities
  const getCenter = useCallback(() => {
    if (activities.length === 0) return { lat: 20, lng: 78 }; // fallback: India
    const lats = activities.map((a) => a.lat);
    const lngs = activities.map((a) => a.lng);
    return {
      lat: lats.reduce((s, v) => s + v, 0) / lats.length,
      lng: lngs.reduce((s, v) => s + v, 0) / lngs.length,
    };
  }, [activities]);

  // When highlightedActivity changes from parent, center on it
  useEffect(() => {
    if (!highlightedActivity || !mapRef.current) return;
    const act = activities.find((a) => a.key === highlightedActivity);
    if (act) {
      mapRef.current.panTo({ lat: act.lat, lng: act.lng });
      setActiveInfo(highlightedActivity);
    }
  }, [highlightedActivity]);

  // Polyline path: activities in order for the active day
  const polylinePath = day
    ? activities.map((a) => ({ lat: a.lat, lng: a.lng }))
    : [];

  const onLoad = useCallback((map) => {
    mapRef.current = map;
    // Auto-fit bounds
    if (activities.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      activities.forEach((a) => bounds.extend({ lat: a.lat, lng: a.lng }));
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    }
  }, [activities]);

  // No API key configured — show friendly fallback instead of broken map
  const hasApiKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  if (!hasApiKey || loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900 rounded-2xl border border-slate-800 p-6">
        <div className="text-center max-w-xs">
          <span className="text-4xl block mb-3">🗺️</span>
          <p className="text-sm font-medium text-slate-300 mb-1">Map View</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            {loadError
              ? 'Could not load the map. Please try refreshing the page.'
              : 'Map visualization is coming soon! Activities are shown in the timeline on the left.'}
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900 rounded-2xl border border-slate-800">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-400 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading map...</p>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900 rounded-2xl border border-slate-800 p-6">
        <div className="text-center max-w-xs">
          <span className="text-4xl block mb-3">📍</span>
          <p className="text-sm font-medium text-slate-300 mb-1">No locations for this day</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Location data is being prepared. Switch to another day or check back shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl overflow-hidden border border-slate-800 relative">
      {/* Map legend */}
      <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur-sm border border-slate-700/60 rounded-xl px-3 py-2 space-y-1">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Legend</p>
        {[
          { color: '#f59e0b', label: 'Morning' },
          { color: '#0ea5e9', label: 'Afternoon' },
          { color: '#8b5cf6', label: 'Evening' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] text-slate-400">{item.label}</span>
          </div>
        ))}
        <p className="text-[10px] text-slate-600 pt-1 border-t border-slate-700/40">Click markers for details</p>
      </div>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={getCenter()}
        zoom={13}
        options={MAP_OPTIONS}
        onLoad={onLoad}
      >
        {/* Activity markers */}
        {activities.map((act) => (
          <MarkerF
            key={act.key}
            position={{ lat: act.lat, lng: act.lng }}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: highlightedActivity === act.key ? 12 : 9,
              fillColor: SLOT_COLORS[act.slot]?.marker || '#14b8a6',
              fillOpacity: 1,
              strokeColor: '#0f172a',
              strokeWeight: 2,
            }}
            onClick={() => {
              setActiveInfo(act.key);
              onMarkerClick?.(act.key);
            }}
          >
            {activeInfo === act.key && (
              <InfoWindowF
                position={{ lat: act.lat, lng: act.lng }}
                onCloseClick={() => setActiveInfo(null)}
              >
                <div className="max-w-[200px] p-1">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {CAT_ICONS[act.category] || '📍'} {act.place}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Day {act.dayNum} · {act.slot} · {act.time}
                  </p>
                  {act.duration && (
                    <p className="text-[10px] text-slate-500">{act.duration}</p>
                  )}
                </div>
              </InfoWindowF>
            )}
          </MarkerF>
        ))}

        {/* Route polyline for single day view */}
        {polylinePath.length > 1 && (
          <PolylineF
            path={polylinePath}
            options={{
              strokeColor: SLOT_COLORS[activities[0]?.slot]?.line || '#14b8a6',
              strokeOpacity: 0.6,
              strokeWeight: 3,
              geodesic: true,
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
}
