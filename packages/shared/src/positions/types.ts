export type FillSide = 'buy' | 'sell';
export type PositionSide = 'long' | 'short';
export type PositionStatus = 'open' | 'closed';
export type FillRole = 'entry' | 'scale_in' | 'exit' | 'scale_out';

export interface RawFill {
  id: bigint;
  symbol: string;
  side: FillSide;
  qty: string; // positive decimal string
  price: string; // positive decimal string
  fee: string; // positive decimal string (always a cost to the trader)
  fundingFee: string | null; // signed decimal string (negative = paid, positive = received)
  executedAt: Date;
  leverage: number | null;
}

export interface PositionFillLink {
  fillId: bigint;
  role: FillRole;
}

export interface ComputedPosition {
  symbol: string;
  side: PositionSide;
  status: PositionStatus;
  openedAt: Date;
  closedAt: Date | null;
  qtyMax: string; // peak inventory held during the position's life
  avgEntry: string; // qty-weighted average entry price
  avgExit: string | null; // qty-weighted average exit price; null while open
  grossPnl: string; // realized gross P&L (0 while open)
  fees: string; // sum of all fill fees
  funding: string; // sum of all funding fees (signed)
  netPnl: string; // grossPnl - fees + funding
  leverage: number | null; // leverage of the fill that opened the position
  sourceHash: string; // sorted fill IDs joined — deterministic cache key
  fills: PositionFillLink[];
}
