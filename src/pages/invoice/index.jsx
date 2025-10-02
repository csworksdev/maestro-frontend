import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Table from "@/components/globals/table/table";
import PaginationComponent from "@/components/globals/table/pagination";
import Button from "@/components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getInvoiceAll, DeleteInvoice } from "@/axios/invoice"; // ✅ ganti axios ke invoice
import Search from "@/components/globals/table/search";
import SkeletionTable from "@/components/skeleton/Table";
import TableAction from "@/components/globals/table/tableAction";
import { useSelector } from "react-redux";
import { DateTime } from "luxon";
import CopyText from "@/components/custom/copytext";

// Komponen badge untuk status
const StatusBadge = ({ status }) => {
  let colorClass = "bg-gray-200 text-gray-700";
  if (status === "PAID" || status === "SETTLED") {
    colorClass = "bg-green-100 text-green-700 border border-green-400";
  } else if (status === "PENDING") {
    colorClass = "bg-yellow-100 text-yellow-700 border border-yellow-400";
  } else if (status === "EXPIRED" || status === "FAILED") {
    colorClass = "bg-red-100 text-red-700 border border-red-400";
  }

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}
    >
      {status}
    </span>
  );
};

const Invoice = () => {
  const navigate = useNavigate();
  const [listData, setListData] = useState({ count: 0, results: [] });
  const [isLoading, setIsLoading] = useState(true);

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const { roles } = useSelector((state) => state.auth.data);

  const actionsAdmin = [
    {
      name: "edit",
      icon: "heroicons:pencil-square",
      onClick: (row) => handleEdit(row.row.original),
    },
  ];
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

  const fetchData = async (page, size, query) => {
    try {
      setIsLoading(true);
      const params = {
        page: page + 1,
        page_size: size,
        search: query,
      };
      getInvoiceAll(params)
        .then((res) => {
          setListData(res.data);
        })
        .finally(() => setIsLoading(false));
    } catch (error) {
      console.error("Error fetching invoice", error);
    }
  };

  useEffect(() => {
    fetchData(pageIndex, pageSize, searchQuery);
  }, [pageIndex, pageSize, searchQuery]);

  const handlePageChange = (page) => setPageIndex(page);
  const handlePageSizeChange = (size) => setPageSize(size);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPageIndex(0);
  };

  const handleDelete = (e) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This invoice will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        DeleteInvoice(e.external_id).then((res) => {
          if (res.status) {
            Swal.fire("Deleted!", "Invoice deleted successfully.", "success");
            fetchData(pageIndex, pageSize, searchQuery);
          }
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
      Header: "Invoice ID",
      accessor: "external_id",
      Cell: (row) => <CopyText text={row?.cell?.value} />,
    },
    {
      Header: "Order ID",
      accessor: "order_id",
      Cell: (row) => <CopyText text={row?.cell?.value} />,
    },
    {
      Header: "Amount",
      accessor: "amount",
      Cell: (row) => (
        <span className="whitespace-nowrap truncate">
          Rp {parseInt(row?.cell?.value).toLocaleString()}
        </span>
      ),
    },
    {
      Header: "Status",
      accessor: "status",
      Cell: (row) => <StatusBadge status={row?.cell?.value} />,
    },
    {
      Header: "Paid At",
      accessor: "paid_at",
      Cell: (row) => {
        return row?.cell?.value
          ? DateTime.fromISO(row?.cell?.value).toFormat("dd LLLL yyyy")
          : "";
      },
    },
    {
      Header: "Deskripsi",
      accessor: "description",
      Cell: (row) => <span>{row?.cell?.value}</span>,
    },
    {
      Header: "Action",
      accessor: "action",
      id: "action",
      sticky: "right",
      Cell: (row) => (
        <div className="flex space-x-2 justify-center items-center">
          {(roles === "Admin" ? actionsAdmin : actions).map((action, index) => (
            <TableAction key={action.id || index} action={action} row={row} />
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 justify-end">
      <Card
        title="Invoice"
        headerslot={
          <Button className="btn-primary ">
            <Link to="add" isupdate="false">
              Tambah Invoice
            </Link>
          </Button>
        }
      >
        {isLoading ? (
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

export default Invoice;
