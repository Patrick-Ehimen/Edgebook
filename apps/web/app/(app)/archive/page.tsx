import type { Metadata } from 'next';
import { ArchiveClient } from './ArchiveClient';

export const metadata: Metadata = { title: 'Archive — Edgebook' };

export default function ArchivePage() {
  return <ArchiveClient />;
}
