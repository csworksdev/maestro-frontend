import { axiosConfig } from "../config";

const BASE = "/accounting/expenses/";

const normalizeExpense = (item = {}) => ({
  ...item,
  amount: item.amount ?? item.total_with_tax ?? 0,
  currency: item.currency || "IDR",
});

const buildExpensePayload = (payload = {}) => {
  const {
    title,
    description,
    category,
    amount,
    currency,
    transaction_date,
    payment_method,
    vendor,
    cost_center,
    project_code,
    notes,
    attachment_url,
    status,
  } = payload;

  return {
    title,
    description,
    category,
    amount,
    currency,
    transaction_date,
    payment_method,
    vendor,
    cost_center,
    project_code,
    notes,
    attachment_url,
    status,
  };
};

export const getExpenses = async (params) => {
  try {
    const res = await axiosConfig.get(BASE, { params });
    const payload = res?.data || {};
    const list = Array.isArray(payload?.data) ? payload.data : [];
    const normalized = list.map(normalizeExpense);
    return { ...res, data: { ...payload, data: normalized } };
  } catch (error) {
    console.error("Error fetching expenses:", error);
    throw error;
  }
};

export const createExpense = async (payload) => {
  try {
    return await axiosConfig.post(BASE, buildExpensePayload(payload));
  } catch (error) {
    console.error("Error creating expense:", error);
    throw error;
  }
};

export const updateExpense = async (expenseId, payload) => {
  try {
    return await axiosConfig.put(
      `${BASE}${expenseId}/`,
      buildExpensePayload(payload)
    );
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
