import { api } from "@/lib/api-client";
import {
  DeleteResponse,
  WatchlistItemSchema,
  WatchlistListResponse,
} from "./schemas";

export interface CreateWatchlistItemBody {
  symbol: string;
  horizon: "day" | "week" | "month";
  bias: "long" | "short" | "neutral" | "watch";
  notes?: string;
  conviction?: number;
  convictionReason?: string;
  tags?: string[];
  playbookNames?: string[];
  keyLevelsJson?: Array<{ type: string; price: string; label: string }>;
  images?: string[];
}

export interface UpdateWatchlistItemBody {
  horizon?: "day" | "week" | "month";
  bias?: "long" | "short" | "neutral" | "watch";
  notes?: string;
  conviction?: number;
  convictionReason?: string;
  tags?: string[];
  playbookNames?: string[];
  keyLevelsJson?: Array<{ type: string; price: string; label: string }>;
  images?: string[];
}

export const watchlistApi = {
  list: () => api.get("/watchlist", WatchlistListResponse),
  getById: (id: string) => api.get(`/watchlist/${id}`, WatchlistItemSchema),
  create: (body: CreateWatchlistItemBody) =>
    api.post("/watchlist", WatchlistItemSchema, body),
  update: (id: string, body: UpdateWatchlistItemBody) =>
    api.patch(`/watchlist/${id}`, WatchlistItemSchema, body),
  remove: (id: string) => api.delete(`/watchlist/${id}`, DeleteResponse),
};
