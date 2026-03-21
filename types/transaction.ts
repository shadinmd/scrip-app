import { Category } from './category';

export interface Transaction {
  id: number;
  amount: string;
  description: string;
  date: string;
  categoryId: number | null;
  category: Category | null;
  createdAt: string;
}
