import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Table from "@/components/globals/table/table";
import Loading from "@/components/Loading";
import { useNavigate } from "react-router-dom";
import { getTrainerAll } from "@/axios/masterdata/trainer";
import Search from "@/components/globals/table/search";
import PaginationComponent from "@/components/globals/table/pagination";
import TableAction from "@/components/globals/table/tableAction";

const RekapTrainer = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [listData, setListData] = useState({ count: 0, results: [] });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const actions = [
    {
      name: "Rekap",
      icon: "heroicons-outline:eye",
      onClick: (row) => handleDetail(row.row.original),
      className:
        "bg-success-500 text-success-500 bg-opacity-30 hover:bg-opacity-100 hover:text-white",
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
      getTrainerAll(params)
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

  const handleDetail = (e) => {
    navigate("detailorderpelatih", {
      state: {
        data: e,
      },
    });
  };

  const COLUMNS = [
    {
      Header: "Trainer",
      accessor: "fullname",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
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
      Cell: (row) => {
        return (
          <div className="flex space-x-2 items-center">
            <div className="flex space-x-2">
              {actions.map((action, index) => (
                <TableAction action={action} index={index} row={row} />
              ))}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 justify-end">
      <Card title="Rekap Per Pelatih">
        {isLoading ? (
          <Loading />
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

export default RekapTrainer;
