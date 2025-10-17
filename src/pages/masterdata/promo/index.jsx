import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Table from "@/components/globals/table/table";
import PaginationComponent from "@/components/globals/table/pagination";
import Button from "@/components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getPromoAll, deletePromo } from "@/axios/masterdata/promo"; // 👈 bikin axios wrapper
import Search from "@/components/globals/table/search";
import SkeletionTable from "@/components/skeleton/Table";
import TableAction from "@/components/globals/table/tableAction";
import { DateTime } from "luxon";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

const Promo = () => {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const promoQuery = useQuery({
    queryKey: ["promo", { pageIndex, pageSize, searchQuery }],
    queryFn: async () => {
      const params = {
        page: pageIndex + 1,
        page_size: pageSize,
        search: searchQuery,
      };
      const res = await getPromoAll(params);
      return res.data;
    },
    keepPreviousData: true,
  });

  const listData = promoQuery.data ?? { count: 0, results: [] };

  const handlePageChange = (page) => {
    setPageIndex(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPageIndex(0);
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => deletePromo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo"] });
    },
  });

  const handleDelete = (row) => {
    Swal.fire({
      title: "Yakin hapus promo?",
      text: "Aksi ini tidak bisa dibatalkan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Ya, hapus!",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(row.id, {
          onSuccess: (res) => {
            if (res?.status === 204) {
              Swal.fire("Deleted!", "Promo berhasil dihapus.", "success");
            }
          },
          onError: (error) => {
            console.error("Gagal menghapus promo:", error);
          },
        });
      }
    });
  };

  const handleEdit = (row) => {
    navigate("edit", {
      state: {
        isupdate: "true",
        data: row,
      },
    });
  };

  const COLUMNS = [
    {
      Header: "Nama Promo",
      accessor: "nama_promo",
      size: 300,
      Cell: (row) => <span>{row?.cell?.value}</span>,
    },
    {
      Header: "Start Date",
      accessor: "start_date",
      Cell: (row) => {
        return row?.cell?.value
          ? DateTime.fromISO(row?.cell?.value).toFormat("dd LLL yyyy")
          : "-";
      },
    },
    {
      Header: "End Date",
      accessor: "end_date",
      Cell: (row) => {
        return row?.cell?.value
          ? DateTime.fromISO(row?.cell?.value).toFormat("dd LLL yyyy")
          : "-";
      },
    },
    {
      Header: "Action",
      accessor: "action",
      id: "action",
      sticky: "right",
      Cell: (row) => (
        <div className="flex space-x-2 justify-center items-center">
          <TableAction
            action={{
              name: "edit",
              icon: "heroicons:pencil-square",
              onClick: () => handleEdit(row.row.original),
            }}
            index={0}
            row={row}
          />
          <TableAction
            action={{
              name: "delete",
              icon: "heroicons-outline:trash",
              onClick: () => handleDelete(row.row.original),
              className:
                "bg-danger-500 text-danger-500 bg-opacity-30 hover:bg-opacity-100 hover:text-white",
            }}
            index={1}
            row={row}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 justify-end">
      <Card
        title="Promo"
        headerslot={
          <Button className="btn-primary ">
            <Link to="add" isupdate="false">
              Tambah
            </Link>
          </Button>
        }
      >
        {promoQuery.isLoading ? (
          <SkeletionTable />
        ) : (
          <>
            <Search searchValue={searchQuery} handleSearch={handleSearch} />
            <Table
              listData={listData}
              listColumn={COLUMNS}
              searchValue={searchQuery}
              handleSearch={handleSearch}
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

export default Promo;
