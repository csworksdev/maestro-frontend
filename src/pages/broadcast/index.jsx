import React, { useEffect, useState, useMemo } from "react";
import Card from "@/components/ui/Card";
import Table from "@/components/globals/table/table";
import PaginationComponent from "@/components/globals/table/pagination";
import Search from "@/components/globals/table/search";
import SkeletionTable from "@/components/skeleton/Table";
import { BroadcastExport, getBroadcast } from "@/axios/broadcast/broadcast";
import { Icon } from "@iconify/react";
import AsyncSelect from "react-select/async";
import { getCabangAll } from "@/axios/referensi/cabang";
import { useAuthStore } from "@/redux/slicers/authSlice";

const Broadcast = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownload, setIsDownload] = useState(false);
  const [branchOption, setBranchOption] = useState([]);
  const [listData, setListData] = useState({ count: 0, results: [] });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(null); // Default as null

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
      onClick: (row) => {},
    },
    {
      name: "Delete",
      icon: "heroicons-outline:trash",
      onClick: (row) => {},
      className:
        "bg-danger-500 text-danger-500 bg-opacity-30 hover:bg-opacity-100 hover:text-white",
    },
  ];

  const fetchData = async (page = 0, size, query, branch_id) => {
    try {
      setIsLoading(true);
      const params = {
        page: page + 1,
        page_size: size,
        search: query,
        branch_id: branch_id || selectedBranch, // Use selectedBranch if branch_id is not provided
      };
      const response = await getBroadcast(params);
      setListData(response.data);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBranch = async () => {
    try {
      const params = {
        page: 1,
        page_size: 200,
        is_active: true,
      };
      const kolamResponse = await getCabangAll(params);

      const kolamOption = kolamResponse.data.results
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((item) => ({
          value: item.branch_id,
          label: item.name,
        }));

      setBranchOption(kolamOption);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBranch();
  }, []);

  useEffect(() => {
    fetchData(pageIndex, pageSize, searchQuery, selectedBranch);
  }, [pageIndex, pageSize, searchQuery, selectedBranch]); // Added selectedBranch to dependencies

  const handlePageChange = (page) => setPageIndex(page);
  const handlePageSizeChange = (size) => setPageSize(size);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPageIndex(0); // Reset to first page on search
  };

  const handleBranchChange = (e) => {
    setSelectedBranch(e.value);
    // fetchData(0, pageSize, searchQuery, e.value); // Fetch data with the selected branch immediately
  };

  const downloadExcelFile = async () => {
    try {
      setIsDownload(true);
      let response = await BroadcastExport({ branch_id: selectedBranch });
      const blob = new Blob([response], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    } catch (error) {
      console.error("Error downloading the file:", error);
    } finally {
      setIsDownload(false);
    }
  };

  const memoizedBranchOptions = useMemo(() => branchOption, [branchOption]);

  const COLUMNS = [
    {
      Header: "Siswa",
      accessor: "fullname",
      size: 500,
      Cell: (row) => <span>{row?.cell?.value}</span>,
    },
    {
      Header: "Kode negara",
      accessor: "country_code",
      Cell: (row) => <span>{row?.cell?.value}</span>,
    },
    {
      Header: "Nomor WA",
      accessor: "local_number",
      Cell: (row) => <span>{row?.cell?.value}</span>,
    },
    {
      Header: "action",
      accessor: "action",
      id: "action",
      sticky: "right",
      Cell: (row) => <></>, // This is an empty placeholder for action buttons
    },
  ];

  return (
    <div className="grid grid-cols-1 justify-end">
      <Card title="Siswa">
        <>
          <div>
            <label className="form-label" htmlFor="kolam">
              Cabang
            </label>
            <div className="grid grid-cols-2 gap-3">
              <AsyncSelect
                name="kolam"
                label="Kolam"
                placeholder="Pilih Cabang"
                defaultOptions={memoizedBranchOptions}
                onChange={handleBranchChange} // Call the handler when the branch is selected
                className="grow z-20"
              />
              <Search searchValue={searchQuery} handleSearch={handleSearch} />
            </div>
          </div>
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
                canNextPage={
                  pageIndex < Math.ceil(listData.count / pageSize) - 1
                }
                gotoPage={handlePageChange}
                previousPage={() => handlePageChange(pageIndex - 1)}
                nextPage={() => handlePageChange(pageIndex + 1)}
                setPageSize={handlePageSizeChange}
              />
            </>
          )}
        </>
      </Card>
    </div>
  );
};

export default Broadcast;
