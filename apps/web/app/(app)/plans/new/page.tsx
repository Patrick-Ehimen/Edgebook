import type { Metadata } from 'next';
import { NewPlanClient } from './NewPlanClient';

export const metadata: Metadata = { title: 'New plan — Edgebook' };

export default function NewPlanPage() {
  return <NewPlanClient />;
}
