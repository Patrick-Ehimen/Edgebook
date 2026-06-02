import type { Metadata } from 'next';
import { PlaybookDetailClient } from './_components/PlaybookDetailClient';

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: 'Playbook — Edgebook' };

export default async function PlaybookDetailPage({ params }: Props) {
  const { id } = await params;
  return <PlaybookDetailClient id={id} />;
}
