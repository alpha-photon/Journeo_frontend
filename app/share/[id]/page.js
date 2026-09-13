import ShareClient from './ShareClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://journeo.com';

export async function generateMetadata({ params }) {
  try {
    const r = await fetch(`${API_URL}/api/itinerary/share/${params.id}`, { cache: 'no-store' });
    const data = await r.json();

    if (!data.success) throw new Error('not found');

    const destination = data.destination || data.itinerary?.destination || 'A Trip';
    const days = data.itinerary?.totalDays || data.days;
    const style = data.travelStyle ? ` · ${data.travelStyle.charAt(0).toUpperCase() + data.travelStyle.slice(1)}` : '';
    const overview = data.itinerary?.overview || `${days}-day AI-generated itinerary for ${destination}.`;
    const title = `${destination} — ${days}-Day Itinerary${style}`;
    const pageUrl = `${APP_URL}/share/${params.id}`;

    return {
      title: `${title} | Journeo`,
      description: overview.slice(0, 160),
      openGraph: {
        type: 'article',
        siteName: 'Journeo',
        title,
        description: overview.slice(0, 160),
        url: pageUrl,
        images: [
          {
            url: `/og-default.png`,
            width: 1200,
            height: 630,
            alt: `${destination} itinerary`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: overview.slice(0, 160),
        images: ['/og-default.png'],
      },
    };
  } catch {
    return {
      title: 'Travel Itinerary | Journeo',
      description: 'View this AI-generated travel itinerary on Journeo.',
    };
  }
}

export default function SharePage({ params }) {
  return <ShareClient shareId={params.id} />;
}
