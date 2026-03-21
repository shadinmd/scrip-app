export interface LoanInstallment {
  id: number;
  amount: string;
  date: string;
  isPaid: boolean;
  loanId: number;
}
