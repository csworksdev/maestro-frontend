import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { isDevDeploymentHost, resolveApiBaseUrl } from "@/utils/apiUrl";

// Keep the legacy template endpoints unchanged in production.
const isDevDeployment = import.meta.env.MODE === "development" ||
  (typeof window !== "undefined" && isDevDeploymentHost(window.location.hostname));

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: isDevDeployment ? resolveApiBaseUrl() : "/",
  }),
  endpoints: (builder) => ({}),
});
