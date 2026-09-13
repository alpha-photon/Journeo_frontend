import './globals.css';
import { AuthProvider } from './context/AuthContext';
import { FeatureFlagProvider } from './context/FeatureFlagContext';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://journeo.com';

export const metadata = {
  title: 'Journeo — AI Travel Planner',
  description: 'Plan your perfect trip in 30 seconds with AI-powered itineraries, Reddit insights, and expert recommendations.',
  manifest: '/manifest.json',
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: 'website',
    siteName: 'Journeo',
    title: 'Journeo — AI Travel Planner',
    description: 'Plan your perfect trip in 30 seconds with AI. Get day-by-day itineraries tailored to your travel style.',
    url: APP_URL,
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Journeo — AI Travel Planner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Journeo — AI Travel Planner',
    description: 'Plan your perfect trip in 30 seconds with AI.',
    images: ['/og-default.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Journeo',
  },
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-64.png', sizes: '64x64', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export const viewport = {
  themeColor: '#FAF6EE',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-paper text-ink antialiased">
        {process.env.NODE_ENV === 'development' && (
          <script dangerouslySetInnerHTML={{ __html: `
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(regs => {
                regs.forEach(r => r.unregister());
              });
              caches.keys().then(keys => {
                keys.forEach(k => caches.delete(k));
              });
            }
          `}} />
        )}
        <FeatureFlagProvider>
          <AuthProvider>{children}</AuthProvider>
        </FeatureFlagProvider>
      </body>
    </html>
  );
}
