import type { Metadata } from 'next';
import { JournalClient } from './JournalClient';

export const metadata: Metadata = { title: 'Daily Journal — Edgebook' };

export default function JournalPage() {
  return <JournalClient />;
}
