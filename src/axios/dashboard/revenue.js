import { axiosConfig } from "../config";
const prefix = "/dashboard";

export const getRevenueAll = async () => {
  try {
    let response = await axiosConfig.get(prefix + "/revenue/all/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getRevenueAllPerTahun = async () => {
  try {
    let response = await axiosConfig.get(prefix + "/revenue/all/tahun/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getRevenueAllPerCabang = async () => {
  try {
    let response = await axiosConfig.get(prefix + "/revenue/all/cabang/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getRevenueAllPerProduk = async () => {
  try {
    let response = await axiosConfig.get(prefix + "/revenue/all/produk/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
