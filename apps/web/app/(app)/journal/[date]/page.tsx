import type { Metadata } from 'next';
import { JournalDetailClient } from './JournalDetailClient';

export const metadata: Metadata = { title: 'Journal Entry — Edgebook' };

export default async function JournalEntryPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  return <JournalDetailClient date={date} />;
}
