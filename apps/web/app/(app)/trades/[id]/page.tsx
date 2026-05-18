import { TradeDetailClient } from './trade-detail-client';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ account?: string }>;
};

export default async function TradeDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { account } = await searchParams;
  return <TradeDetailClient positionId={id} accountId={account ?? null} />;
}
