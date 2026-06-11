import type { Metadata } from 'next';
import ConnectAccountsClient from './ConnectAccountsClient';

export const metadata: Metadata = { title: 'Accounts — Edgebook' };

export default function AccountsPage() {
  return <ConnectAccountsClient />;
}
