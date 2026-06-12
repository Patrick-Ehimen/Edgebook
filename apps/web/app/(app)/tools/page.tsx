import type { Metadata } from 'next';
import { ToolsClient } from './ToolsClient';

export const metadata: Metadata = { title: 'Tools — Edgebook' };

export default function ToolsPage() {
  return <ToolsClient />;
}
