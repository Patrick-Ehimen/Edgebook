import type { Metadata } from 'next';
import { PlanDetailClient } from './PlanDetailClient';

export const metadata: Metadata = { title: 'Plan — Edgebook' };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PlanPage({ params }: Props) {
  const { id } = await params;
  return <PlanDetailClient planId={id} />;
}
