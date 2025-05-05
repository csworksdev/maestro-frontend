import React, { Fragment, useRef, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Loading from "@/components/Loading";
import { useNavigate } from "react-router-dom";
import Search from "@/components/globals/table/search";
import PaginationComponent from "@/components/globals/table/pagination";
import { getXenditTransaction } from "@/axios/xendit";
import TableXendit from "@/components/globals/table/tableXendit";

const XenditTransaction = () => {
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
      getXenditTransaction(params)
        .then((res) => {
          setListData(res.data.data);
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
      Header: "Type",
      accessor: "type",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Channel",
      accessor: "channel_category",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Akun",
      accessor: "channel_code",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Jumlah",
      accessor: "amount",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Referensi",
      accessor: "reference_id",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Status Settlement",
      accessor: "settlement_status",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Perkiraan Waktu Settlement",
      accessor: "estimated_settlement_time",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 justify-end">
      <Card title="Transaksi">
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

export default XenditTransaction;
