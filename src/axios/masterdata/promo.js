import { axiosConfig } from "../config";

export const getPromoAll = (params) => {
  return axiosConfig.get("/api/promo/", { params });
};

export const deletePromo = (id) => {
  return axiosConfig.delete(`/api/promo/${id}/`);
};

export const addPromo = (data) => {
  return axiosConfig.post("/api/promo/", data);
};

export const editPromo = (id, data) => {
  return axiosConfig.put(`/api/promo/${id}/`, data);
};
