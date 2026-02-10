
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
  batch_name: string;
  start_date: string;
  initial_count: number;
  current_count: number;
  breed: string;
  weightLogs: WeightLog[];
  mortalityLogs: MortalityLog[];
  feedLogs: FeedLog[];
}

export interface WeightLog {
  id: string;
  date: string;
  average_weight: number; 
  sample_size: number;
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
  current_quantity: number;
  unit: string;
  min_threshold: number;
}

export interface FarmState {
  transactions: Transaction[];
  flocks: FlockRecord[];
  inventory: InventoryItem[];
}
