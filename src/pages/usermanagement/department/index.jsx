import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Loading from "@/components/Loading";
import Search from "@/components/globals/table/search";
import Table from "@/components/globals/table/table";
import TableAction from "@/components/globals/table/tableAction";
import PaginationComponent from "@/components/globals/table/pagination";
import {
  DeleteDepartment,
  getDepartmentsAll,
} from "@/axios/userManagement/department";

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const Department = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [listData, setListData] = useState({ count: 0, results: [] });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async (page, size, query) => {
    try {
      setIsLoading(true);
      const params = {
        page: page + 1,
        page_size: size,
        search: query,
        ordering: "-id",
      };
      const res = await getDepartmentsAll(params);
      setListData(res?.data || { count: 0, results: [] });
    } catch (error) {
      console.error("Error fetching data", error);
      Swal.fire("Error!", "Gagal mengambil data department.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pageIndex, pageSize, searchQuery);
  }, [pageIndex, pageSize, searchQuery]);

  const handlePageChange = (page) => {
    setPageIndex(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPageIndex(0);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPageIndex(0);
  };

  const handleEdit = (department) => {
    navigate("Edit", {
      state: {
        isupdate: "true",
        data: department,
      },
    });
  };

  const handleDelete = (department) => {
    Swal.fire({
      title: "Hapus department?",
      text: `${department?.name || "Department"} akan dihapus.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      const res = await DeleteDepartment(department.department_id);
      if (res?.status) {
        Swal.fire("Deleted!", "Department has been deleted.", "success");
        fetchData(pageIndex, pageSize, searchQuery);
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
      name: "Delete",
      icon: "heroicons-outline:trash",
      onClick: (row) => handleDelete(row.row.original),
      className:
        "bg-danger-500 text-danger-500 bg-opacity-30 hover:bg-opacity-100 hover:text-white",
    },
  ];

  const COLUMNS = [
    {
      Header: "Department",
      accessor: "name",
      Cell: (row) => <span>{row?.cell?.value || "-"}</span>,
    },
    {
      Header: "Description",
      accessor: "description",
      Cell: (row) => <span>{row?.cell?.value || "-"}</span>,
    },
    {
      Header: "Role",
      accessor: "group_name",
      Cell: (row) => <span>{row?.cell?.value || "-"}</span>,
    },
    {
      Header: "Created At",
      accessor: "created_at",
      Cell: (row) => <span>{formatDateTime(row?.cell?.value)}</span>,
    },
    {
      Header: "Updated At",
      accessor: "updated_at",
      Cell: (row) => <span>{formatDateTime(row?.cell?.value)}</span>,
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
        title="Department"
        headerslot={
          <Button className="btn-primary ">
            <Link to="add" isupdate="false">
              Tambah
            </Link>
          </Button>
        }
      >
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <Search
              searchValue={searchQuery}
              handleSearch={handleSearch}
              isLoading={isLoading}
              placeholder="Cari department"
            />
            <Table
              tableId="department"
              listData={listData}
              listColumn={COLUMNS}
              searchValue={searchQuery}
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

export default Department;
