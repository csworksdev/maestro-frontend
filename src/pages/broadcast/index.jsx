import React, { Fragment, useRef, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Table from "@/components/globals/table/table";
import PaginationComponent from "@/components/globals/table/pagination";
import Button from "@/components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { DateTime } from "luxon";
import Search from "@/components/globals/table/search";
import SkeletionTable from "@/components/skeleton/Table";
import TableAction from "@/components/globals/table/tableAction";
import { useSelector } from "react-redux";
import { BroadcastExport, getBroadcast } from "@/axios/broadcast/broadcast";
import { Icon } from "@iconify/react";

const Broadcast = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownload, setIsDownload] = useState(false);

  const [listData, setListData] = useState({ count: 0, results: [] });
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
      onClick: (row) => {},
    },
    {
      name: "delete",
      icon: "heroicons-outline:trash",
      onClick: (row) => {},
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
      getBroadcast(params)
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

  const downloadExcelFile = async () => {
    try {
      setIsDownload(true);
      let response = await BroadcastExport();
      // Create a Blob from the response
      const blob = new Blob([response], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    } catch (error) {
      console.error("Error downloading the file:", error);
    } finally {
      setIsDownload(false);
    }
  };

  const COLUMNS = [
    {
      Header: "Siswa",
      accessor: "fullname",
      size: 500,
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Kode negara",
      accessor: "country_code",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Nomor WA",
      accessor: "local_number",
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
          <></>
          // <div className="flex space-x-2 justify-center items-center">
          //   {(roles === "Admin" ? actionsAdmin : actions).map(
          //     (action, index) => (
          //       <TableAction action={action} index={index} row={row} />
          //     )
          //   )}
          // </div>
        );
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 justify-end">
      <Card title="Siswa">
        <button
          type="button"
          className="btn btn-success text-center h-9 py-1 px-5 w-max "
          onClick={() => downloadExcelFile()}
          disabled={isDownload}
        >
          <div className="flex flex-row align-center gap-1">
            <Icon
              icon="heroicons-outline:arrow-down-on-square-stack"
              color="Green"
              className={`h-6 w-6`}
            />
            <span>Export List</span>
          </div>
        </button>
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

export default Broadcast;
