
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum Category {
  FEED = 'FEED',
  MEDICINE = 'MEDICINE',
  CHICKEN_PURCHASE = 'CHICKEN_PURCHASE',
  SALES = 'SALES',
  UTILITIES = 'UTILITIES',
  LABOR = 'LABOR',
  OTHER = 'OTHER'
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  category: Category;
  amount: number;
  description: string;
  quantity?: number;
  unit?: string;
  flock_id?: string;
}

export interface FeedLog {
  id: string;
  date: string;
  amount: number;
  unit: string;
  flock_id?: string;
}

export interface FlockRecord {
  id: string;
  batchName: string; // Matches Supabase "batchName"
  startDate: string; // Matches Supabase "startDate"
  initialCount: number; // Matches Supabase "initialCount"
  currentCount: number; // Matches Supabase "currentCount"
  breed: string;
  weightLogs: WeightLog[];
  mortalityLogs: MortalityLog[];
  feedLogs: FeedLog[];
}

export interface WeightLog {
  id: string;
  date: string;
  averageWeight: number; // Matches Supabase "averageWeight"
  sampleSize: number; // Matches Supabase "sampleSize"
  flock_id?: string;
}

export interface MortalityLog {
  id: string;
  date: string;
  count: number;
  reason?: string;
  flock_id?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: Category.FEED | Category.MEDICINE;
  currentQuantity: number; // Matches Supabase "currentQuantity"
  unit: string;
  minThreshold: number; // Matches Supabase "minThreshold"
}

export interface FarmState {
  transactions: Transaction[];
  flocks: FlockRecord[];
  inventory: InventoryItem[];
}

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  profilePic?: string; // stored in auth metadata or base64
}
