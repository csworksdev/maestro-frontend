import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Loading from "@/components/Loading";
import Search from "@/components/globals/table/search";
import Table from "@/components/globals/table/table";
import TableAction from "@/components/globals/table/tableAction";
import PaginationComponent from "@/components/globals/table/pagination";
import {
  DeleteJob,
  UpdateJobStatus,
  getJobBranchesAll,
  getJobDepartmentsAll,
  getJobsAll,
} from "@/axios/career/job";

const dropdownParams = { page: 1, page_size: 200 };

const stripHtml = (value) => {
  if (!value) return "-";
  if (typeof document === "undefined") return String(value);

  const element = document.createElement("div");
  element.innerHTML = value;
  return element.textContent || element.innerText || "-";
};

const extractResults = (response) => {
  const data = response?.data ?? response;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data?.results)) return data.data.results;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
};

const Loker = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownLoading, setIsDropdownLoading] = useState(false);
  const [listData, setListData] = useState({ count: 0, results: [] });
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({
    search: "",
    filter_branch_id: "",
    filter_departement_id: "",
  });

  const departmentOptions = useMemo(
    () =>
      departments.map((department) => ({
        value: department.department_id,
        label: department.name,
      })),
    [departments],
  );

  const branchOptions = useMemo(
    () =>
      branches.map((branch) => ({
        value: branch.branch_id,
        label: branch.name,
      })),
    [branches],
  );

  const fetchDropdowns = async () => {
    try {
      setIsDropdownLoading(true);
      const [departmentResponse, branchResponse] = await Promise.all([
        getJobDepartmentsAll(dropdownParams),
        getJobBranchesAll(dropdownParams),
      ]);

      setDepartments(extractResults(departmentResponse));
      setBranches(extractResults(branchResponse));
    } catch (error) {
      console.error("Error fetching loker dropdowns", error);
      Swal.fire("Error!", "Gagal memuat data department atau cabang.", "error");
    } finally {
      setIsDropdownLoading(false);
    }
  };

  const fetchData = async (page, size, nextFilters) => {
    try {
      setIsLoading(true);
      const params = {
        page: page + 1,
        page_size: size,
        search: nextFilters.search,
        ordering: "-id",
      };

      if (nextFilters.filter_branch_id) {
        params.filter_branch_id = nextFilters.filter_branch_id;
      }

      if (nextFilters.filter_departement_id) {
        params.filter_departement_id = nextFilters.filter_departement_id;
      }

      const res = await getJobsAll(params);
      setListData(res?.data || { count: 0, results: [] });
    } catch (error) {
      console.error("Error fetching jobs", error);
      Swal.fire("Error!", "Gagal mengambil data loker.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchData(pageIndex, pageSize, filters);
  }, [pageIndex, pageSize, filters]);

  const handlePageChange = (page) => {
    setPageIndex(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPageIndex(0);
  };

  const handleSearch = (query) => {
    setFilters((current) => ({ ...current, search: query }));
    setPageIndex(0);
  };

  const handleFilterChange = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setPageIndex(0);
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      filter_branch_id: "",
      filter_departement_id: "",
    });
    setPageIndex(0);
  };

  const handleEdit = (job) => {
    navigate("Edit", {
      state: {
        isupdate: "true",
        data: job,
      },
    });
  };

  const handleStatusChange = (job) => {
    const nextStatus = job.status === "published" ? "draft" : "published";

    Swal.fire({
      title: "Ubah status loker?",
      text: `${job?.title || "Loker"} akan diubah ke ${nextStatus}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Ya, ubah",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        const res = await UpdateJobStatus(job.job_id, nextStatus);
        if (res?.status) {
          Swal.fire("Updated!", "Status loker berhasil diubah.", "success");
          fetchData(pageIndex, pageSize, filters);
        }
      } catch (error) {
        Swal.fire("Error!", "Gagal mengubah status loker.", "error");
      }
    });
  };

  const handleDelete = (job) => {
    Swal.fire({
      title: "Hapus loker?",
      text: `${job?.title || "Loker"} akan dihapus.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        const res = await DeleteJob(job.job_id);
        if (res?.status) {
          Swal.fire("Deleted!", "Loker berhasil dihapus.", "success");
          fetchData(pageIndex, pageSize, filters);
        }
      } catch (error) {
        Swal.fire("Error!", "Gagal menghapus loker.", "error");
      }
    });
  };

  const actions = [
    {
      name: "Edit",
      icon: "heroicons:pencil-square",
      onClick: (row) => handleEdit(row.row.original),
    },
    {
      name: "Status",
      icon: "heroicons-outline:arrow-path",
      onClick: (row) => handleStatusChange(row.row.original),
    },
    {
      name: "Delete",
      icon: "heroicons-outline:trash",
      onClick: (row) => handleDelete(row.row.original),
      className:
        "bg-danger-500 text-danger-500 bg-opacity-30 hover:bg-opacity-100 hover:text-white",
    },
  ];

  const COLUMNS = [
    {
      Header: "Judul",
      accessor: "title",
      Cell: (row) => <span>{row?.cell?.value || "-"}</span>,
    },
    {
      Header: "Department",
      accessor: "department_name",
      Cell: (row) => <span>{row?.cell?.value || "-"}</span>,
    },
    {
      Header: "Cabang",
      accessor: "branch_name",
      Cell: (row) => <span>{row?.cell?.value || "-"}</span>,
    },
    {
      Header: "Deskripsi",
      accessor: "description",
      Cell: (row) => (
        <span className="line-clamp-2">{stripHtml(row?.cell?.value)}</span>
      ),
    },
    {
      Header: "Status",
      accessor: "status_display",
      Cell: (row) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            row?.row?.original?.status === "published"
              ? "bg-success-500/10 text-success-600"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {row?.cell?.value || row?.row?.original?.status || "-"}
        </span>
      ),
    },
    {
      Header: "action",
      accessor: "action",
      id: "action",
      sticky: "right",
      Cell: (row) => (
        <div className="flex flex-wrap gap-2 justify-center items-center">
          {actions.map((action, index) => (
            <TableAction key={action.id || index} action={action} row={row} />
          ))}
        </div>
      ),
    },
  ];

  const pageCount = Math.ceil((listData?.count || 0) / pageSize);

  return (
    <div className="grid grid-cols-1 justify-end">
      <Card
        title="Loker"
        headerslot={
          <Button className="btn-primary ">
            <Link to="add" isupdate="false">
              Tambah
            </Link>
          </Button>
        }
      >
        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Search
            searchValue={filters.search}
            handleSearch={handleSearch}
            isLoading={isLoading}
            placeholder="Cari loker"
          />
          <Select
            placeholder="Semua department"
            options={departmentOptions}
            value={filters.filter_departement_id}
            disabled={isDropdownLoading}
            onChange={(event) =>
              handleFilterChange("filter_departement_id", event.target.value)
            }
          />
          <Select
            placeholder="Semua cabang"
            options={branchOptions}
            value={filters.filter_branch_id}
            disabled={isDropdownLoading}
            onChange={(event) =>
              handleFilterChange("filter_branch_id", event.target.value)
            }
          />
          <Button
            text="Reset Filter"
            type="button"
            className="h-[50px] bg-slate-100 text-slate-700"
            icon="heroicons-outline:arrow-path"
            onClick={handleResetFilters}
          />
        </div>

        {isLoading ? (
          <Loading />
        ) : (
          <>
            <Table
              tableId="loker"
              listData={listData}
              listColumn={COLUMNS}
              searchValue={filters.search}
              handleSearch={handleSearch}
            />
            <PaginationComponent
              pageSize={pageSize}
              pageIndex={pageIndex}
              pageCount={pageCount}
              canPreviousPage={pageIndex > 0}
              canNextPage={pageIndex < pageCount - 1}
              gotoPage={handlePageChange}
              previousPage={() => handlePageChange(pageIndex - 1)}
              nextPage={() => handlePageChange(pageIndex + 1)}
              setPageSize={handlePageSizeChange}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default Loker;
