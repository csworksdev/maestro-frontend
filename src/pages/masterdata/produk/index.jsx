import React, { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Table from "@/components/globals/table/table";
import Button from "@/components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  DeleteProduk,
  getProdukAll,
  getProdukPool,
} from "@/axios/masterdata/produk";
import Search from "@/components/globals/table/search";
import PaginationComponent from "@/components/globals/table/pagination";
import SkeletionTable from "@/components/skeleton/Table";
import TableAction from "@/components/globals/table/tableAction";
import { Tab } from "@headlessui/react";
import AsyncSelect from "react-select/async";
import { getKolamByBranch } from "@/axios/referensi/kolam";
import { getCabangAll } from "@/axios/referensi/cabang";

const Produk = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [branchOption, setBranchOption] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState();
  const [selectedPool, setSelectedPool] = useState();
  const [poolOption, setPoolOption] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState();

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
      setLoading(false);
    }
  };

  const loadPool = async (branch_id) => {
    setLoading(true);
    try {
      const res = await getKolamByBranch(branch_id);
      const sorted = res.data.results.sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      setPoolOption(sorted);

      if (sorted.length > 0) {
        setSelectedPool(0); // safe to trigger fetch
      } else {
        setSelectedPool(null); // nothing to fetch
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranch();
  }, []);

  const fetchData = async (page = 1, size = 100, query = "") => {
    const pool = poolOption?.[selectedPool];
    if (!pool) return;

    try {
      setIsLoading(true);

      const pool_id = pool.pool_id;
      const params = {
        page: page + 1,
        page_size: size,
        search: query,
      };

      const response = await getProdukPool(pool_id, params);
      setListData(response.data);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPool !== null && poolOption[selectedPool]) {
      fetchData(pageIndex, pageSize, searchQuery);
    }
  }, [selectedPool, poolOption, pageIndex, pageSize, searchQuery]);

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
        DeleteProduk(e.product_id).then((res) => {
          if (res.status) {
            Swal.fire("Deleted!", "Your file has been deleted.", "success");
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

  const handleBranchChange = (e) => {
    setSelectedBranch(e.value);
    setSelectedPool(null); // reset selectedPool
    setListData({ count: 0, results: [] }); // reset list
    loadPool(e.value);
  };

  const handlePoolChange = (index) => {
    setSelectedPool(index);
  };

  const COLUMNS = [
    {
      Header: "Produk",
      accessor: "name",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    // {
    //   Header: "Kolam",
    //   accessor: "pool_name",
    //   Cell: (row) => {
    //     return <span>{row?.cell?.value}</span>;
    //   },
    // },
    {
      Header: "Paket",
      accessor: "package_name",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Pertemuan",
      accessor: "meetings",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Harga Dasar",
      accessor: "price",
      Cell: (row) => {
        let number = parseFloat(row?.cell?.value);
        return <span>{number.toLocaleString("IDR")}</span>;
      },
    },
    {
      Header: "Harga Jual",
      accessor: "sellprice",
      Cell: (row) => {
        let number = parseFloat(row?.cell?.value);
        return <span>{number.toLocaleString("IDR")}</span>;
      },
    },
    {
      Header: "action",
      accessor: "action",
      id: "action",
      sticky: "right",
      Cell: (row) => {
        return (
          <div className="flex space-x-2 justify-center items-center">
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

  const memoizedBranchOptions = useMemo(() => branchOption, [branchOption]);

  return (
    <>
      <Card title="Produk">
        <div>
          <label className="form-label" htmlFor="kolam">
            Cabang
          </label>
          <div className="flex gap-3">
            <AsyncSelect
              name="kolam"
              label="Kolam"
              placeholder="Pilih Cabang"
              defaultOptions={memoizedBranchOptions}
              loadOptions={branchOption}
              onChange={handleBranchChange}
              className="grow z-20"
            />
          </div>
        </div>
        {selectedBranch ? (
          <div className="py-4">
            <Tab.Group selectedIndex={selectedPool} onChange={handlePoolChange}>
              <Tab.List>
                <>
                  {poolOption.map((item, i) => (
                    <Tab key={i}>
                      {({ selected }) => (
                        <button
                          className={`text-sm font-medium mb-7 last:mb-0 capitalize px-6 py-2 rounded-md transition duration-150 focus:outline-none ring-0
                            ${
                              selected
                                ? "text-white bg-primary-500"
                                : "text-slate-500 bg-white dark:bg-slate-700 dark:text-slate-300"
                            }`}
                        >
                          {`${item.name}`}
                        </button>
                      )}
                    </Tab>
                  )) ?? null}
                </>
              </Tab.List>
              <Tab.Panels>
                {poolOption.map((item, index) => (
                  <Tab.Panel key={index}>
                    <div className="pt-4">
                      {isLoading ? (
                        <SkeletionTable />
                      ) : (
                        <>
                          <div className="grid-cols-2">
                            <Button className="btn-primary h-auto">
                              <Link to="add" isupdate="false">
                                Tambah
                              </Link>
                            </Button>
                            {/* <Search
              searchValue={searchQuery}
              handleSearch={handleSearch}
            /> */}
                          </div>
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
                              pageIndex <
                              Math.ceil(listData.count / pageSize) - 1
                            }
                            gotoPage={handlePageChange}
                            previousPage={() => handlePageChange(pageIndex - 1)}
                            nextPage={() => handlePageChange(pageIndex + 1)}
                            setPageSize={handlePageSizeChange}
                          />
                        </>
                      )}
                    </div>
                  </Tab.Panel>
                ))}
              </Tab.Panels>
            </Tab.Group>
          </div>
        ) : null}
      </Card>
    </>
  );
};

export default Produk;
