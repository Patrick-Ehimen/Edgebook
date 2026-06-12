import type { Metadata } from 'next';
import { GoalsClient } from './GoalsClient';

export const metadata: Metadata = { title: 'Goals & Rules — Edgebook' };

export default function GoalsPage() {
  return <GoalsClient />;
}
