import { axiosConfig } from "../config";

const BASE = "/accounting/expenses/";

export const getExpenses = async (params) => {
  try {
    return await axiosConfig.get(BASE, { params });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    throw error;
  }
};

export const createExpense = async (payload) => {
  try {
    return await axiosConfig.post(BASE, payload);
  } catch (error) {
    console.error("Error creating expense:", error);
    throw error;
  }
};

export const updateExpense = async (expenseId, payload) => {
  try {
    return await axiosConfig.put(`${BASE}${expenseId}/`, payload);
  } catch (error) {
    console.error("Error updating expense:", error);
    throw error;
  }
};

export const deleteExpense = async (expenseId) => {
  try {
    return await axiosConfig.delete(`${BASE}${expenseId}/`);
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
};
