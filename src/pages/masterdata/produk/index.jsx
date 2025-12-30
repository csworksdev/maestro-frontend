import React, { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Table from "@/components/globals/table/table";
import Button from "@/components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { DeleteProduk, getProdukPool } from "@/axios/masterdata/produk";
import Search from "@/components/globals/table/search";
import PaginationComponent from "@/components/globals/table/pagination";
import SkeletionTable from "@/components/skeleton/Table";
import TableAction from "@/components/globals/table/tableAction";
import { Tab } from "@headlessui/react";
import Select from "react-select";
import { getKolamByBranch } from "@/axios/referensi/kolam";
import { getCabangAll } from "@/axios/referensi/cabang";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const fetchBranchOptions = async () => {
  const params = {
    page: 1,
    page_size: 200,
    is_active: true,
  };
  const response = await getCabangAll(params);
  return response.data.results
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => ({
      value: item.branch_id,
      label: item.name,
    }));
};

const Produk = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranchOption, setSelectedBranchOption] = useState(null);
  const [selectedPoolIndex, setSelectedPoolIndex] = useState(0);

  const branchQuery = useQuery({
    queryKey: ["branches", "options"],
    queryFn: fetchBranchOptions,
  });

  const branchOptions = branchQuery.data ?? [];

  // pick first branch when options available
  useEffect(() => {
    if (!selectedBranchOption && branchOptions.length > 0) {
      setSelectedBranchOption(branchOptions[0]);
    }
  }, [branchOptions, selectedBranchOption]);

  const selectedBranchId = selectedBranchOption?.value;

  const poolQuery = useQuery({
    queryKey: ["pools", selectedBranchId],
    queryFn: async () => {
      const res = await getKolamByBranch(selectedBranchId);
      return res.data.results.sort((a, b) => a.name.localeCompare(b.name));
    },
    enabled: !!selectedBranchId,
  });

  const poolOptions = poolQuery.data ?? [];

  useEffect(() => {
    if (poolOptions.length === 0) {
      setSelectedPoolIndex(0);
      return;
    }
    setSelectedPoolIndex((prev) => (prev < poolOptions.length ? prev : 0));
  }, [poolOptions]);

  const selectedPool = poolOptions[selectedPoolIndex] || null;
  const selectedPoolId = selectedPool?.pool_id;

  const produkQuery = useQuery({
    queryKey: [
      "produkPool",
      { poolId: selectedPoolId, pageIndex, pageSize, searchQuery },
    ],
    queryFn: async () => {
      const params = {
        page: pageIndex + 1,
        page_size: pageSize,
        search: searchQuery,
      };
      const response = await getProdukPool(selectedPoolId, params);
      return response.data;
    },
    enabled: !!selectedPoolId,
    keepPreviousData: true,
  });

  const listData = produkQuery.data ?? { count: 0, results: [] };
  const isTableLoading = produkQuery.isLoading || produkQuery.isFetching;

  const deleteMutation = useMutation({
    mutationFn: (productId) => DeleteProduk(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produkPool"] });
    },
  });

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

  const handleDelete = (item) => {
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
        deleteMutation.mutate(item.product_id, {
          onSuccess: (res) => {
            if (res?.status) {
              Swal.fire("Deleted!", "Produk berhasil dihapus.", "success");
            }
          },
          onError: (error) => {
            console.error("Failed to delete product:", error);
          },
        });
      }
    });
  };

  const handleEdit = (item) => {
    navigate("Edit", {
      state: {
        isupdate: "true",
        data: item,
      },
    });
  };

  const handleBranchChange = (option) => {
    setSelectedBranchOption(option);
    setSelectedPoolIndex(0);
    setPageIndex(0);
  };

  const handlePoolChange = (index) => {
    setSelectedPoolIndex(index);
    setPageIndex(0);
  };

  const handlePageChange = (page) => {
    setPageIndex(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPageIndex(0);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPageIndex(0);
  };

  const memoizedBranchOptions = useMemo(() => branchOptions, [branchOptions]);

  const COLUMNS = [
    {
      Header: "Produk",
      accessor: "name",
      Cell: (row) => <span>{row?.cell?.value}</span>,
    },
    {
      Header: "Paket",
      accessor: "package_name",
      Cell: (row) => <span>{row?.cell?.value}</span>,
    },
    {
      Header: "Pertemuan",
      accessor: "meetings",
      Cell: (row) => <span>{row?.cell?.value}</span>,
    },
    {
      Header: "Harga Dasar",
      accessor: "price",
      Cell: (row) => {
        const number = Number(row?.cell?.value || 0);
        return <span>{number.toLocaleString("id-ID")}</span>;
      },
    },
    {
      Header: "Harga Jual",
      accessor: "sellprice",
      Cell: (row) => {
        const number = Number(row?.cell?.value || 0);
        return <span>{number.toLocaleString("id-ID")}</span>;
      },
    },
    {
      Header: "action",
      accessor: "action",
      id: "action",
      sticky: "right",
      Cell: (row) => (
        <div className="flex flex-wrap gap-2 justify-center items-center">
          {actions.map((action, index) => (
            <TableAction key={action.id || index} action={action} row={row} />
          ))}
        </div>
      ),
    },
  ];

  return (
    <Card title="Produk">
      <div>
        <label className="form-label" htmlFor="branch">
          Cabang
        </label>
        <div className="flex gap-3">
          <Select
            className="grow z-20"
            classNamePrefix="select"
            placeholder="Pilih Cabang"
            isClearable
            isLoading={branchQuery.isLoading}
            options={memoizedBranchOptions}
            value={selectedBranchOption}
            onChange={handleBranchChange}
          />
        </div>
      </div>

      {selectedBranchId ? (
        <div className="py-4">
          {poolQuery.isLoading ? (
            <SkeletionTable />
          ) : poolOptions.length === 0 ? (
            <p className="text-center text-slate-500">
              Tidak ada kolam untuk cabang ini.
            </p>
          ) : (
            <Tab.Group
              selectedIndex={selectedPoolIndex}
              onChange={handlePoolChange}
            >
              <Tab.List className="flex flex-wrap gap-2">
                {poolOptions.map((item) => (
                  <Tab key={item.pool_id}>
                    {({ selected }) => (
                      <button
                        className={`text-sm font-medium mb-2 capitalize px-6 py-2 rounded-md transition duration-150 focus:outline-none ring-0 ${
                          selected
                            ? "text-white bg-primary-500"
                            : "text-slate-500 bg-white dark:bg-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {item.name}
                      </button>
                    )}
                  </Tab>
                ))}
              </Tab.List>
              <Tab.Panels>
                {poolOptions.map((item) => (
                  <Tab.Panel key={item.pool_id}>
                    <div className="pt-4">
                      {isTableLoading ? (
                        <SkeletionTable />
                      ) : (
                        <>
                          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
                            <Button className="btn-primary h-auto w-max">
                              <Link to="add" isupdate="false">
                                Tambah
                              </Link>
                            </Button>
                            <Search
                              className="w-full md:w-1/3"
                              onSearch={handleSearch}
                            />
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
                            pageCount={Math.ceil(
                              (listData.count || 0) / pageSize
                            )}
                            canPreviousPage={pageIndex > 0}
                            canNextPage={
                              pageIndex <
                              Math.ceil((listData.count || 0) / pageSize) - 1
                            }
                            gotoPage={handlePageChange}
                            previousPage={() =>
                              handlePageChange(Math.max(pageIndex - 1, 0))
                            }
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
          )}
        </div>
      ) : (
        <div className="py-6">
          {branchQuery.isLoading ? (
            <SkeletionTable />
          ) : (
            <p className="text-center text-slate-500">
              Pilih cabang untuk melihat daftar produk.
            </p>
          )}
        </div>
      )}
    </Card>
  );
};

export default Produk;
