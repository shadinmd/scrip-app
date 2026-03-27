import { Category } from './category';
import { Account } from './account';

export interface Transaction {
  id: number;
  amount: string;
  type: 'debit' | 'credit';
  description: string;
  date: string;
  categoryId: number | null;
  category: Category | null;
  accountId: number | null;
  account: Account | null;
  createdAt: string;
}
