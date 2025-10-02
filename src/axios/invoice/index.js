import { axiosConfig } from "../config";

// ✅ Get all invoice (dengan pagination & search)
export const getInvoiceAll = async (data) => {
  try {
    let response = await axiosConfig.get("/api/invoice/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching invoice:", error);
  }
};

// ✅ Get invoice by ID
export const getInvoiceById = async (id) => {
  try {
    let response = await axiosConfig.get(`/api/invoice/${id}/`);
    return response;
  } catch (error) {
    console.error("Error fetching invoice:", error);
  }
};

// ✅ Search invoice
export const searchInvoice = async (data) => {
  try {
    let response = await axiosConfig.get("/api/invoice/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error searching invoice:", error);
  }
};

// ✅ Create invoice
export const AddInvoice = async (data) => {
  try {
    let response = await axiosConfig.post("/api/invoice/", data);
    return response;
  } catch (error) {
    console.error("Error adding invoice:", error);
  }
};

// ✅ Update invoice
export const EditInvoice = async (id, data) => {
  try {
    let response = await axiosConfig.put(`/api/invoice/${id}/`, data);
    return response;
  } catch (error) {
    console.error("Error editing invoice:", error);
  }
};

// ✅ Delete invoice
export const DeleteInvoice = async (id) => {
  try {
    let response = await axiosConfig.delete(`/api/invoice/${id}/`);
    return response;
  } catch (error) {
    console.error("Error deleting invoice:", error);
  }
};
