
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
}

export interface FlockRecord {
  id: string;
  batchName: string;
  startDate: string;
  initialCount: number;
  currentCount: number;
  breed: string;
  weightLogs: WeightLog[];
  mortalityLogs: MortalityLog[];
  feedLogs: FeedLog[];
}

export interface WeightLog {
  id: string;
  date: string;
  averageWeight: number; // in grams
  sampleSize: number;
}

export interface MortalityLog {
  id: string;
  date: string;
  count: number;
  reason?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: Category.FEED | Category.MEDICINE;
  currentQuantity: number;
  unit: string;
  minThreshold: number;
}

export interface FarmState {
  transactions: Transaction[];
  flocks: FlockRecord[];
  inventory: InventoryItem[];
}
