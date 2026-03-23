import { LoanInstallment } from './loan-installment';

export interface Loan {
  id: number;
  name: string;
  installments: LoanInstallment[];
  userId: number;
  createdAt: string;
}
