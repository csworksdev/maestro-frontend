import { axiosConfig } from "../config";

// Ambil semua followup (admin lihat semua, trainer lihat miliknya)
export const getFollowupAll = (params) => {
  return axiosConfig.get("/api/followups/", { params });
};

// Ambil detail followup by ID
export const getFollowupDetail = (id) => {
  return axiosConfig.get(`/api/followups/${id}/`);
};

// Tambah followup baru
export const addFollowup = (data) => {
  return axiosConfig.post("/api/followups/", data);
};

// Edit / update followup (status atau notes)
export const editFollowup = (id, data) => {
  return axiosConfig.patch(`/api/followups/${id}/`, data);
};

// Hapus followup (kalau memang mau dihapus)
export const deleteFollowup = (id) => {
  return axiosConfig.delete(`/api/followups/${id}/`);
};

// Summary per trainer (admin bisa lihat semua, trainer hanya punya dia)
export const getFollowupSummary = (params = null) => {
  return axiosConfig.get("/api/followups/summary/", params);
};
