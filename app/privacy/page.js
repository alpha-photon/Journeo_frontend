import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Journeo',
  description: 'How Journeo collects, uses, and protects your data.',
};

const LAST_UPDATED = 'April 19, 2026';
const CONTACT_EMAIL = 'privacy@journeo.com';
const APP_NAME = 'Journeo';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-base shadow-lg shadow-teal-900/30">
              ✈️
            </div>
            <span className="text-lg font-bold text-slate-100">Journeo</span>
          </Link>
          <Link href="/" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="mb-10">
          <p className="text-xs text-teal-400 font-semibold uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-3xl font-extrabold text-slate-100 mb-3">Privacy Policy</h1>
          <p className="text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-8">

          <Section title="1. Who We Are">
            <p>{APP_NAME} ("we", "us", "our") is an AI-powered travel planning platform. We help you generate trip itineraries, discover travel buddies, and collaborate with friends on travel plans. Our service is operated independently. Questions? Email <a href={`mailto:${CONTACT_EMAIL}`} className="text-teal-400 hover:text-teal-300">{CONTACT_EMAIL}</a>.</p>
          </Section>

          <Section title="2. What We Collect">
            <p className="mb-3">We collect only what's necessary to run the service:</p>
            <ul>
              <li><strong className="text-slate-200">Account data</strong> — your email address and hashed password when you create an account.</li>
              <li><strong className="text-slate-200">Itinerary data</strong> — destinations, trip duration, and travel style you enter to generate itineraries.</li>
              <li><strong className="text-slate-200">Travel Buddy data</strong> — your first name, travel dates, bio, and travel style if you opt-in to Travel Buddy matching (opt-in only, never shared without consent).</li>
              <li><strong className="text-slate-200">Collaboration data</strong> — votes, comments, and suggestions you make on shared trips.</li>
              <li><strong className="text-slate-200">Usage data</strong> — pages visited, features used, and device type, collected via analytics to improve the product.</li>
            </ul>
            <p className="mt-3">We do <strong className="text-slate-200">not</strong> collect payment information, phone numbers, or government IDs.</p>
          </Section>

          <Section title="3. How We Use Your Data">
            <ul>
              <li>To generate and save your AI-powered itineraries</li>
              <li>To authenticate your account and keep sessions secure</li>
              <li>To match you with other solo travelers (Travel Buddy, only if you opt-in)</li>
              <li>To send password reset emails (only when requested by you)</li>
              <li>To improve the product based on aggregate usage patterns</li>
            </ul>
            <p className="mt-3">We do not sell your personal data to third parties. We do not use your data to train AI models.</p>
          </Section>

          <Section title="4. Data Sharing">
            <p>We share your data only in these limited cases:</p>
            <ul>
              <li><strong className="text-slate-200">Travel Buddy matches</strong> — your first name, travel style, and trip dates are shown to other opted-in travelers. Your email is only revealed when both parties accept a connection request.</li>
              <li><strong className="text-slate-200">Shared itinerary links</strong> — if you share a trip link, anyone with the link can view that itinerary. You control sharing.</li>
              <li><strong className="text-slate-200">Service providers</strong> — MongoDB Atlas (database hosting), Vercel (frontend hosting), Railway (backend hosting). All are bound by data processing agreements.</li>
              <li><strong className="text-slate-200">Legal requirements</strong> — we may disclose data if required by law.</li>
            </ul>
          </Section>

          <Section title="5. Data Retention">
            <ul>
              <li>Your account and associated data is retained until you delete your account.</li>
              <li>Itineraries are retained indefinitely unless you delete them.</li>
              <li>Password reset tokens expire after 1 hour and are deleted after use.</li>
              <li>Travel Buddy listings are deleted when you opt out or delete your account.</li>
            </ul>
          </Section>

          <Section title="6. Your Rights">
            <p>Depending on your location, you may have rights to:</p>
            <ul>
              <li><strong className="text-slate-200">Access</strong> — request a copy of the data we hold about you</li>
              <li><strong className="text-slate-200">Deletion</strong> — request deletion of your account and all associated data</li>
              <li><strong className="text-slate-200">Correction</strong> — update incorrect information in your account</li>
              <li><strong className="text-slate-200">Portability</strong> — receive your data in a machine-readable format</li>
              <li><strong className="text-slate-200">Opt-out</strong> — withdraw consent for Travel Buddy at any time by removing your listing</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, email <a href={`mailto:${CONTACT_EMAIL}`} className="text-teal-400 hover:text-teal-300">{CONTACT_EMAIL}</a>. We'll respond within 30 days.</p>
          </Section>

          <Section title="7. Cookies & Local Storage">
            <p>We use browser <strong className="text-slate-200">localStorage</strong> (not cookies) to store your authentication token and session data. No third-party tracking cookies are set. We may use basic analytics (e.g. page view counts) that do not identify individuals.</p>
          </Section>

          <Section title="8. Security">
            <p>Passwords are hashed using bcrypt and never stored in plain text. All data is transmitted over HTTPS. Access to production systems is restricted to authorised personnel only. Despite our efforts, no system is 100% secure — please use a strong, unique password.</p>
          </Section>

          <Section title="9. Children">
            <p>{APP_NAME} is not directed at children under 13. We do not knowingly collect data from children. If you believe a child has provided us with personal data, contact us and we will delete it promptly.</p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>We may update this policy as the product evolves. We'll update the "Last updated" date at the top. Continued use of the service after changes constitutes acceptance of the updated policy.</p>
          </Section>

          <Section title="11. Contact">
            <p>For any privacy-related questions or requests: <a href={`mailto:${CONTACT_EMAIL}`} className="text-teal-400 hover:text-teal-300">{CONTACT_EMAIL}</a></p>
          </Section>

        </div>

        {/* Footer links */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-wrap gap-4 text-sm text-slate-500">
          <Link href="/terms" className="hover:text-teal-400 transition-colors">Terms of Service</Link>
          <Link href="/" className="hover:text-teal-400 transition-colors">← Back to Journeo</Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-base font-bold text-slate-100 mb-4">{title}</h2>
      <div className="text-sm text-slate-400 leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-teal-400 [&_a:hover]:text-teal-300">
        {children}
      </div>
    </div>
  );
}
