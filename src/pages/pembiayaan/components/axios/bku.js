import { axiosConfig } from "./axios";

export const getBkuDibuat = async () => {
    try {
        let response = await axiosConfig.get("/sp2d/buatbku");
        return response;
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

export const getlistBku = async () => {
    try {
        let response = await axiosConfig.get("/sp2d/bku");
        return response;
    } catch (error) {
        console.error("Error fetching data:", error);
    }

}