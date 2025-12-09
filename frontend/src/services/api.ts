import axios from 'axios';
import { Transaction, Category, BehavioralInsights } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadStatements = async (files: FileList) => {
  const formData = new FormData();
  Array.from(files).forEach((file) => {
    formData.append('statements', file);
  });

  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getTransactions = async (params?: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  primaryCategory?: string;
  minConfidence?: number;
  search?: string;
}) => {
  const response = await api.get('/transactions', { params });
  return response.data;
};

export const enhanceTransactions = async (transactionIds: string[]) => {
  const response = await api.post('/transactions/enhance', { transactionIds });
  return response.data;
};

export const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
  const response = await api.patch(`/transactions/${id}`, updates);
  return response.data;
};

export const getCategories = async (): Promise<{
  categories: Category[];
  primaryCategories: string[];
}> => {
  const response = await api.get('/categories');
  return response.data;
};

export const getDetailedCategories = async (primary: string): Promise<{ detailedCategories: Category[] }> => {
  const response = await api.get(`/categories/${primary}`);
  return response.data;
};

export const getInsights = async (): Promise<BehavioralInsights> => {
  const response = await api.get('/insights');
  return response.data;
};

export const exportCSV = async () => {
  const response = await api.get('/export/csv', {
    responseType: 'blob',
  });
  return response.data;
};

export const clearData = async () => {
  const response = await api.delete('/transactions');
  return response.data;
};
