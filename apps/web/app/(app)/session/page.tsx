import type { Metadata } from 'next';
import { SessionClient } from './SessionClient';

export const metadata: Metadata = { title: 'Pre-Session Checklist — Edgebook' };

export default function SessionPage() {
  return <SessionClient />;
}
