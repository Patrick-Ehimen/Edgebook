import type { Metadata } from 'next';
import { EditPlanClient } from './EditPlanClient';

export const metadata: Metadata = { title: 'Edit plan — Edgebook' };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditPlanPage({ params }: Props) {
  const { id } = await params;
  return <EditPlanClient planId={id} />;
}
