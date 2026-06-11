import type { Metadata } from 'next';
import MindLabClient from './MindLabClient';

export const metadata: Metadata = { title: 'Mind Lab — Edgebook' };

export default function MindLabPage() {
  return <MindLabClient />;
}
