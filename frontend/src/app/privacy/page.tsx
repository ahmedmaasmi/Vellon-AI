import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy | Vellon AI',
  description: 'How Vellon AI handles your data and privacy.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-16 max-w-2xl mx-auto">
      <Link href="/" className="text-primary hover:underline text-sm font-medium mb-8 inline-block">
        ← Back to home
      </Link>
      <h1 className="text-3xl font-bold font-handwriting mb-6">Privacy</h1>
      <p className="text-muted-foreground leading-relaxed mb-4">
        This is a placeholder privacy page. Replace this content with your full privacy policy before production launch.
        In the product, we treat your notes as yours: we don&apos;t sell your data and we don&apos;t use your content to
        train public AI models.
      </p>
      <p className="text-muted-foreground leading-relaxed">
        For questions, contact <a href="mailto:support@vellon.ai" className="text-primary hover:underline">support@vellon.ai</a>.
      </p>
    </div>
  );
}
