import { useQueries, useQuery } from "@tanstack/react-query";
import {
  getCareerDashboard, getCareerDashboardJobs, getCareerDashboardApplications,
  getCareerDashboardDepartments, getCareerDashboardBranches, getDepartments, getBranches,
} from "@/axios/career/jobs";
import { filterParams, readDashboard, readList } from "./data";

const endpoints = [
  ["summary", getCareerDashboard], ["jobs", getCareerDashboardJobs],
  ["applications", getCareerDashboardApplications], ["departments", getCareerDashboardDepartments],
  ["branches", getCareerDashboardBranches],
];

async function loadOptions(fetcher, type, signal) {
  const options = new Map();
  let page = 1;
  let received = 0;
  while (true) {
    const response = await fetcher({ page, page_size: 100, ordering: "name" }, { signal });
    const payload = response.data;
    const rows = readList(payload, `${type}s`);
    rows.forEach((row) => {
      const value = row[`${type}_id`] || row.id;
      const label = row.name || row[`${type}_name`];
      if (value && label) options.set(value, { value, label });
    });
    received += rows.length;
    const pagination = payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
    const hasNext = pagination?.next || (pagination?.count != null && received < Number(pagination.count));
    if (!hasNext || rows.length === 0) break;
    page += 1;
  }
  return [...options.values()];
}

export default function useCareerDashboard(filters) {
  const params = filterParams(filters);
  const queries = useQueries({
    queries: endpoints.map(([name, fetcher]) => ({
      queryKey: ["careerDashboard", name, params],
      queryFn: async ({ signal }) => {
        const data = readDashboard(await fetcher(params, { signal }));
        return ["departments", "branches"].includes(name) ? readList(data, name) : data;
      },
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    })),
  });
  const departments = useQuery({
    queryKey: ["careerDashboardOptions", "departments"],
    queryFn: ({ signal }) => loadOptions(getDepartments, "department", signal),
    staleTime: 300_000,
    retry: 1,
  });
  const branches = useQuery({
    queryKey: ["careerDashboardOptions", "branches"],
    queryFn: ({ signal }) => loadOptions(getBranches, "branch", signal),
    staleTime: 300_000,
    retry: 1,
  });
  return {
    ...Object.fromEntries(endpoints.map(([name], index) => [name, queries[index]])),
    departmentOptions: departments, branchOptions: branches,
    isFetching: queries.some((query) => query.isFetching),
    refresh: () => Promise.allSettled([...queries, departments, branches].map((query) => query.refetch())),
  };
}
