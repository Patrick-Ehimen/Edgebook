import type { Metadata } from 'next';
import { SubaccountDetailClient } from './SubaccountDetailClient';

export const metadata: Metadata = { title: 'Subaccount — Edgebook' };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SubaccountPage({ params }: Props) {
  const { id } = await params;
  return <SubaccountDetailClient accountId={id} />;
}
