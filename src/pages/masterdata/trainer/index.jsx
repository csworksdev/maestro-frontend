import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Table from "@/components/globals/table/table";
import Button from "@/components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { DeleteTrainer, getTrainerAll } from "@/axios/masterdata/trainer";
import { DateTime } from "luxon";
import Search from "@/components/globals/table/search";
import PaginationComponent from "@/components/globals/table/pagination";
import SkeletionTable from "@/components/skeleton/Table";
import TableAction from "@/components/globals/table/tableAction";
import { toProperCase } from "@/utils";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  setLoading,
  useLoadingStore,
} from "@/redux/slicers/loadingSlice";

const Trainer = () => {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const actions = [
    {
      name: "edit",
      icon: "heroicons:pencil-square",
      onClick: (row) => handleEdit(row.row.original),
    },
    {
      name: "delete",
      icon: "heroicons-outline:trash",
      onClick: (row) => handleDelete(row.row.original),
      className:
        "bg-danger-500 text-danger-500 bg-opacity-30 hover:bg-opacity-100 hover:text-white",
    },
  ];

  const trainerQuery = useQuery({
    queryKey: ["trainer", { pageIndex, pageSize, searchQuery }],
    queryFn: async () => {
      const params = {
        page: pageIndex + 1,
        page_size: pageSize,
        search: searchQuery,
      };
      const res = await getTrainerAll(params);
      return res.data;
    },
    keepPreviousData: true,
  });

  const listData = trainerQuery.data ?? { count: 0, results: [] };
  const isLoading = useLoadingStore((state) => state.isLoading);

  useEffect(() => {
    setLoading(trainerQuery.isFetching);
  }, [trainerQuery.isFetching]);

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
    mutationFn: (id) => DeleteTrainer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainer"] });
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
        deleteMutation.mutate(e.trainer_id, {
          onSuccess: (res) => {
            if (res?.status) {
              Swal.fire("Deleted!", "Your file has been deleted.", "success");
            }
          },
          onError: (error) => {
            console.error("Failed to delete trainer:", error);
          },
        });
      }
    });
  };

  const handleEdit = (e) => {
    navigate("edit", {
      state: {
        isupdate: "true",
        data: e,
      },
    });
  };

  const COLUMNS = [
    {
      Header: "Trainer",
      accessor: "fullname",
      Cell: (row) => {
        return <span>{toProperCase(row?.cell?.value)}</span>;
      },
    },
    {
      Header: "Panggilan",
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
      Header: "Aktif",
      accessor: "is_active",
      Cell: (row) => {
        return <span>{row?.cell?.value ? "Aktif" : "Tidak Aktif"}</span>;
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
            {actions.map((action, index) => (
              <TableAction
                key={action.id || index} // 👈 kasih key DI SINI
                action={action}
                row={row}
              />
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 justify-end">
      <Card
        title="Trainer"
        headerslot={
          <Button className="btn-primary ">
            <Link to="add" isupdate="false">
              Tambah
            </Link>
          </Button>
        }
      >
        <Search searchValue={searchQuery} handleSearch={handleSearch} />
        {trainerQuery.isLoading ? (
          <SkeletionTable />
        ) : (
          <>
            <Table
              listData={listData}
              listColumn={COLUMNS}
              searchValue={searchQuery}
              handleSearch={handleSearch}
              isLoading={isLoading}
            />
            <PaginationComponent
              pageSize={pageSize}
              pageIndex={pageIndex}
              pageCount={Math.ceil(listData.count / pageSize)}
              canPreviousPage={pageIndex > 0}
              canNextPage={pageIndex < Math.ceil(listData.count / pageSize) - 1}
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

export default Trainer;
