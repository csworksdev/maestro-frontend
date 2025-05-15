import { axiosConfig } from "../config";

export const getXenditTransaction = async () => {
  try {
    let response = await axiosConfig.get("/xendit/transactions/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getXenditInvoiceHistory = async () => {
  try {
    let response = await axiosConfig.get("/xendit/invoice-history/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getXenditBalance = async () => {
  try {
    let response = await axiosConfig.get("/xendit/balance/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getXenditBalanceHistory = async (params) => {
  try {
    let response = await axiosConfig.get("/xendit/balance-history/", {
      params,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const XenditCreatePaymentLink = async (params) => {
  try {
    let response = await axiosConfig.post(
      "/xendit/create-payment-link/",
      params
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
