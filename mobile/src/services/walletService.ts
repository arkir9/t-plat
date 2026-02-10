import { api } from './api';

export interface WalletTransaction {
    id: string;
    amount: number;
    type: string;
    createdAt: string;
    metadata?: any;
    balanceAfter?: number;
}

export const walletService = {
  async getBalance() {
    const response = await api.get('/wallet/balance');
    return response.data; 
  },

  async getTransactions() {
    const response = await api.get('/wallet/transactions');
    return response.data;
  },

  async withdraw(amount: number, phoneNumber: string) {
    const response = await api.post('/wallet/withdraw', { amount, phoneNumber });
    return response.data;
  }
};