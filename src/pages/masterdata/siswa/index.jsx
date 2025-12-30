import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Table from "@/components/globals/table/table";
import PaginationComponent from "@/components/globals/table/pagination";
import Button from "@/components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { DeleteSiswa, getSiswaAll } from "@/axios/masterdata/siswa";
import { DateTime } from "luxon";
import Search from "@/components/globals/table/search";
import SkeletionTable from "@/components/skeleton/Table";
import TableAction from "@/components/globals/table/tableAction";
import { useAuthStore } from "@/redux/slicers/authSlice";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const Siswa = () => {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { roles } = useAuthStore((state) => state.data);
  const actionsAdmin = [
    {
      name: "Edit",
      icon: "heroicons:pencil-square",
      onClick: (row) => handleEdit(row.row.original),
    },
  ];
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

  const siswaQuery = useQuery({
    queryKey: ["siswa", { pageIndex, pageSize, searchQuery }],
    queryFn: async () => {
      const params = {
        page: pageIndex + 1,
        page_size: pageSize,
        search: searchQuery,
      };
      const res = await getSiswaAll(params);
      return res.data;
    },
    keepPreviousData: true,
  });

  const listData = siswaQuery.data ?? { count: 0, results: [] };

  const handlePageChange = (page) => {
    setPageIndex(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPageIndex(0); // Reset to first page on search
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => DeleteSiswa(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siswa"] });
    },
  });

  const handleDelete = (e) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(e.student_id, {
          onSuccess: (res) => {
            if (res?.status) {
              Swal.fire("Deleted!", "Your file has been deleted.", "success");
            }
          },
          onError: (error) => {
            console.error("Failed to delete student:", error);
          },
        });
      }
    });
  };

  const handleEdit = (e) => {
    navigate("Edit", {
      state: {
        isupdate: "true",
        data: e,
      },
    });
  };

  const COLUMNS = [
    {
      Header: "Nama Lengkap",
      accessor: "fullname",
      size: 500,
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Nama Panggilan",
      accessor: "nickname",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Jenis Kelamin",
      accessor: "gender",
      Cell: (row) => {
        return (
          <span>{row?.cell?.value == "L" ? "Laki-laki" : "Perempuan"}</span>
        );
      },
    },
    {
      Header: "Usia",
      accessor: "dob",
      Cell: (row) => {
        if (!row?.cell?.value) return <span>{row?.cell?.value}</span>;
        const today = DateTime.now();
        const dob = DateTime.fromISO(row?.cell?.value);
        const age = today.diff(dob, ["years"]).years;
        return <span>{Math.floor(age)} Tahun</span>;
      },
    },
    {
      Header: "Cabang",
      accessor: "branch_name",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "action",
      accessor: "action",
      id: "action",
      sticky: "right",
      Cell: (row) => {
        return (
          <div className="flex flex-wrap gap-2 justify-center items-center">
            {(roles === "Admin" ? actionsAdmin : actions).map(
              (action, index) => (
                <TableAction
                  key={action.id || index} // 👈 key unik di sini
                  action={action}
                  row={row}
                />
              )
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 justify-end">
      <Card
        title="Siswa"
        headerslot={
          <Button className="btn-primary ">
            <Link to="add" isupdate="false">
              Tambah
            </Link>
          </Button>
        }
      >
        {siswaQuery.isLoading ? (
          <SkeletionTable />
        ) : (
          <>
            <div className="md:flex items-center justify-between mb-4">
              <Search
                searchValue={searchQuery}
                handleSearch={handleSearch}
                className="w-full md:w-1/3"
              />
            </div>

            <Table
              listData={listData}
              listColumn={COLUMNS}
              handleSearch={handleSearch}
            />

            <div className="mt-4">
              <PaginationComponent
                pageIndex={pageIndex}
                pageSize={pageSize}
                totalItems={listData.count}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default Siswa;
