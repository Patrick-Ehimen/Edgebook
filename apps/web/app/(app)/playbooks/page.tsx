import type { Metadata } from 'next';
import { PlaybooksClient } from './_components/PlaybooksClient';

export const metadata: Metadata = { title: 'Playbooks — Edgebook' };

export default function PlaybooksPage() {
  return <PlaybooksClient />;
}
