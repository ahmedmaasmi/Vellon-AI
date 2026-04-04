import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Vellon AI',
  description: 'Terms of service for Vellon AI.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-16 max-w-2xl mx-auto">
      <Link href="/" className="text-primary hover:underline text-sm font-medium mb-8 inline-block">
        ← Back to home
      </Link>
      <h1 className="text-3xl font-bold font-handwriting mb-6">Terms of service</h1>
      <p className="text-muted-foreground leading-relaxed mb-4">
        This is a placeholder terms page. Replace this content with your legal terms of service before production
        launch.
      </p>
      <p className="text-muted-foreground leading-relaxed">
        Questions? <a href="mailto:support@vellon.ai" className="text-primary hover:underline">support@vellon.ai</a>
      </p>
    </div>
  );
}
