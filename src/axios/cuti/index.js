import { axiosConfig } from "../config";

// trainer cuti
export const createTrainerLeave = async (trainer_id, data) => {
  try {
    const response = await axiosConfig.post(
      "/api/leave-request/" + trainer_id + "/",
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error creating leave request:", error);
  }
};

export const getTrainerLeave = async (trainer_id, params) => {
  try {
    const response = await axiosConfig.get(
      "/api/leave-request/" + trainer_id + "/",
      params
    );
    return response.data;
  } catch (error) {
    console.error("Error creating leave request:", error);
  }
};

// list semua cuti
export const getAllTrainerLeaves = async (params = {}) => {
  try {
    const response = await axiosConfig.get("/api/trainer-leave/", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching trainer leaves:", error);
  }
};

// detail cuti
export const getTrainerLeaveById = async (id) => {
  try {
    const response = await axiosConfig.get(`/api/trainer-leave/${id}/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching trainer leave:", error);
  }
};

// approve cuti
export const approveTrainerLeave = async (id, data) => {
  try {
    const response = await axiosConfig.post(
      `/api/trainer-leave/${id}/approve/`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error approving trainer leave:", error);
  }
};

// reject cuti
export const rejectTrainerLeave = async (id, data) => {
  try {
    const response = await axiosConfig.post(
      `/api/trainer-leave/${id}/reject/`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error rejecting trainer leave:", error);
  }
};

// ajukan keberatan oleh admin
export const submitObjection = async (leaveId, data) => {
  try {
    const response = await axiosConfig.post(
      `/api/trainer-leave/${leaveId}/object/`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error submitting objection:", error);
  }
};

// Upload Attachment untuk Siswa di Order (Terpisah)
export const uploadStudentAttachments = async (orderId, formData) => {
  try {
    const response = await axiosConfig.post(
      `/api/trainer-leave/order/${orderId}/attachments/`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error uploading attachments:", error);
  }
};

// Audit Log per Cuti
export const getLeaveAuditLog = async (leaveId) => {
  try {
    const response = await axiosConfig.get(
      `/api/trainer-leave/${leaveId}/audit-log/`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching audit log:", error);
  }
};
