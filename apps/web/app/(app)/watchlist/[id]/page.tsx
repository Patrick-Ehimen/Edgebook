import type { Metadata } from 'next';
import { WatchlistItemDetailClient } from './WatchlistItemDetailClient';

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: 'Watchlist — Edgebook' };

export default async function WatchlistItemPage({ params }: Props) {
  const { id } = await params;
  return <WatchlistItemDetailClient id={id} />;
}
