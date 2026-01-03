export enum UserStatus {
  NEW = 'New',
  CONTACTED = 'Contacted',
  IGNORED = 'Ignored',
  SIGNED = 'Signed'
}

export interface BusinessData {
  name: string;
  rating?: number;
  userRatingCount?: number;
  phone?: string;
  website?: string;
  address: string;
  googleMapsUri?: string;
}

export interface Location {
  lat: number;
  lng: number;
}

export interface AIInsight {
  score: number; // 0-100
  analysis_summary: string;
  suggested_offer: string;
}

export interface Prospect {
  id: string;
  business_data: BusinessData;
  location: Location;
  ai_insight?: AIInsight;
  user_status: UserStatus;
  timestamp: number;
}

// Helper type for map results before they become full prospects
export interface SearchResult {
  id: string;
  business_data: BusinessData;
  location: Location;
}
