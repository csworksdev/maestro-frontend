import React, { Fragment, useRef, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Loading from "@/components/Loading";
import { useNavigate } from "react-router-dom";
import Search from "@/components/globals/table/search";
import { getXenditInvoiceHistory } from "@/axios/xendit";
import TableXendit from "@/components/globals/table/tableXendit";
import Badge from "@/components/ui/Badge";
import { DateTime } from "luxon";

const XenditInvoiceHistory = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [listData, setListData] = useState({ count: 0, results: [] });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

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
      getXenditInvoiceHistory(params)
        .then((res) => {
          setListData(res.data);
        })
        .finally(() => setIsLoading(false));
    } catch (error) {
      console.error("Error fetching data", error);
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
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPageIndex(0); // Reset to first page on search
  };

  const COLUMNS = [
    {
      Header: "Status",
      accessor: "status",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Tanggal Pembayaran",
      accessor: "paid_at",
      Cell: (row) => {
        const date = DateTime.fromISO(row?.cell?.value);
        return (
          <span>
            {date.isValid ? date.toFormat("dd MMM, yyyy hh:mm") : "-"}
          </span>
        );
      },
    },
    {
      Header: "External Id",
      accessor: "external_id",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Deskripsi",
      accessor: "description",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Jumlah",
      accessor: "paid_amount",
      Cell: (row) => {
        return (
          <span className="text-right">
            {isNaN(parseFloat(row?.cell?.value))
              ? "-"
              : parseFloat(row.cell.value).toLocaleString()}
          </span>
        );
      },
    },
    {
      Header: "Item",
      accessor: "items",
      Cell: (row) => {
        return (
          <div className="flex flex-col gap-2">
            {row?.cell?.value.map((item, index) => (
              <Badge>
                <div className="flex flex-col">
                  <div key={index}>Produk : {item.name}</div>
                  <div key={index}>
                    Harga : {parseFloat(item.price).toLocaleString()}
                  </div>
                  <div key={index}>
                    Jumlah : {parseFloat(item.quantity).toLocaleString()}
                  </div>
                </div>
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      Header: "Customer",
      accessor: "customer",
      Cell: (row) => {
        const { given_names, mobile_number } = row?.cell?.value || {};
        return (
          <div className="flex flex-col">
            <span>{given_names}</span>
            <span>{mobile_number ?? null}</span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 justify-end">
      <Card title="Tautan Pembayaran (Invoice)">
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <Search searchValue={searchQuery} handleSearch={handleSearch} />
            <TableXendit
              listData={listData}
              listColumn={COLUMNS}
              searchValue={searchQuery}
              handleSearch={handleSearch}
            />
            {/* <PaginationComponent
              pageSize={pageSize}
              pageIndex={pageIndex}
              pageCount={Math.ceil(listData.count / pageSize)}
              canPreviousPage={pageIndex > 0}
              canNextPage={pageIndex < Math.ceil(listData.count / pageSize) - 1}
              gotoPage={handlePageChange}
              previousPage={() => handlePageChange(pageIndex - 1)}
              nextPage={() => handlePageChange(pageIndex + 1)}
              setPageSize={handlePageSizeChange}
            /> */}
          </>
        )}
      </Card>
    </div>
  );
};

export default XenditInvoiceHistory;
