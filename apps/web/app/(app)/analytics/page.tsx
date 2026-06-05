import type { Metadata } from 'next';
import AnalyticsClient from './AnalyticsClient';

export const metadata: Metadata = { title: 'Analytics — Edgebook' };

export default function AnalyticsPage() {
  return <AnalyticsClient />;
}
