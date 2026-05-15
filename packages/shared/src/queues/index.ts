export const QUEUE_RECOMPUTE = 'recompute';
export const QUEUE_SYNC = 'sync';

export interface RecomputeJobData {
  accountId: string;
  userId: string;
}

export interface SyncJobData {
  accountId: string;
  userId: string;
  /** Full history pull — ignored for incremental syncs */
  fullSync?: boolean;
}
