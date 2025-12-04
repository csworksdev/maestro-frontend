import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";
import Table from "@/components/globals/table/table";
import Search from "@/components/globals/table/search";
import PaginationComponent from "@/components/globals/table/pagination";
import TableAction from "@/components/globals/table/tableAction";
import Icon from "@/components/ui/Icon";
import { getExpenses, deleteExpense } from "@/axios/finance/expense";

const pageSizes = [10, 20, 50];

const defaultFilters = {
  search: "",
  date_from: "",
  date_to: "",
};

const ExpensePage = () => {
  const [filters, setFilters] = useState(defaultFilters);
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        ...filters,
        page: pageIndex + 1,
        page_size: pageSize,
      };
      const res = await getExpenses(params);
      const list = (res?.data?.data || []).map((item) => ({
        ...item,
        id: item.expense_id,
      }));
      setData(list);
      setMeta(res?.data?.meta || {});
    } catch (err) {
      setError("Gagal memuat pengeluaran");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pageIndex, pageSize]);

  const handleChangeFilter = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (value) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setPageIndex(0);
  };

  const applyFilters = () => {
    setPageIndex(0);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setPageIndex(0);
  };

  const handleDelete = async (expenseId) => {
    const ask = window.confirm("Hapus pengeluaran ini?");
    if (!ask) return;

    setError("");
    try {
      await deleteExpense(expenseId);
      fetchData();
    } catch (err) {
      setError("Gagal menghapus pengeluaran");
    }
  };

  const handlePageChange = (page) => {
    setPageIndex(page);
  };

  const pageCount =
    meta?.total_pages ||
    Math.ceil((meta?.count || data.length) / pageSize) ||
    1;

  const totalPageAmount = useMemo(
    () =>
      (data || []).reduce((acc, curr) => acc + Number(curr?.amount || 0), 0),
    [data]
  );

  const listData = useMemo(
    () => ({
      count: meta?.count ?? data.length,
      results: data,
    }),
    [data, meta]
  );

  const actions = [
    {
      name: "Edit",
      icon: "heroicons:pencil-square",
      onClick: (row) =>
        navigate("edit", {
          state: { data: row.row.original },
        }),
    },
    {
      name: "Delete",
      icon: "heroicons-outline:trash",
      className:
        "bg-danger-500 text-danger-500 bg-opacity-30 hover:bg-opacity-100 hover:text-white",
      onClick: (row) => handleDelete(row.row.original.expense_id),
    },
  ];

  const columns = useMemo(
    () => [
      { Header: "Judul", accessor: "title" },
      {
        Header: "Tanggal",
        accessor: "transaction_date",
        Cell: (row) => {
          const trxDate = row?.row?.original?.transaction_date;
          const created = row?.row?.original?.created_at;
          return (
            <div className="text-sm text-slate-700">
              {formatDate(trxDate || created)}
            </div>
          );
        },
      },
      { Header: "Description", accessor: "description" },
      {
        Header: "Jumlah",
        accessor: "amount",
        Cell: (row) => (
          <div className="text-right font-semibold">
            {formatCurrency(
              row?.row?.original?.amount,
              row?.row?.original?.currency
            )}
          </div>
        ),
      },
      { Header: "Penerima", accessor: "vendor" },
      {
        Header: "Dibuat oleh",
        accessor: "created_by",
        Cell: (row) => (
          <div className="text-sm text-slate-700">
            {row?.row?.original?.created_by?.name || "-"}
          </div>
        ),
      },
      {
        Header: "Aksi",
        accessor: "action",
        id: "action",
        sticky: "right",
        Cell: (row) => (
          <div className="flex flex-wrap gap-2 justify-center items-center">
            {actions.map((action, idx) => (
              <TableAction key={idx} action={action} row={row} />
            ))}
          </div>
        ),
      },
    ],
    [actions]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-sky-700 text-white p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase font-semibold tracking-[0.2em] text-sky-200">
              Finance
            </p>
            <h1 className="text-3xl font-bold">Expense Manager</h1>
            <p className="text-sky-100/80">
              Kelola pengeluaran harian dengan pencarian, filter tanggal, dan
              insight cepat.
            </p>
            <div className="flex gap-3 pt-2">
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm">
                <span className="text-sky-100">Total transaksi (page)</span>
                <span className="font-semibold text-white">
                  {listData.count}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm">
                <span className="text-sky-100">Total amount (page)</span>
                <span className="font-semibold text-white">
                  {formatCurrency(
                    totalPageAmount,
                    data?.[0]?.currency || "IDR"
                  )}
                </span>
              </div>
            </div>
          </div>
          <Button
            icon="heroicons-outline:plus"
            className="bg-white text-slate-900 hover:bg-slate-100 shadow-md"
            onClick={() => navigate("add")}
          >
            Tambah pengeluaran
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-danger-200 bg-danger-50/70 text-danger-700 px-4 py-3 text-sm shadow-sm">
          {error}
        </div>
      )}

      <Card
        title="Filter"
        subtitle="Cari pengeluaran berdasarkan kata kunci dan rentang tanggal"
        className="border border-slate-100 shadow-md"
      >
        <div className="grid md:grid-cols-3 gap-4">
          <Textinput
            label="Cari"
            name="search"
            value={filters.search}
            onChange={handleChangeFilter}
            placeholder="Judul, vendor, deskripsi..."
          />
          <Textinput
            type="date"
            label="Dari"
            name="date_from"
            value={filters.date_from}
            onChange={handleChangeFilter}
          />
          <Textinput
            type="date"
            label="Sampai"
            name="date_to"
            value={filters.date_to}
            onChange={handleChangeFilter}
          />
        </div>
        <div className="flex items-center justify-end gap-3">
          <Button
            className="bg-slate-100 text-slate-700 hover:bg-slate-200"
            onClick={resetFilters}
          >
            Reset
          </Button>
          <Button
            className="bg-primary-500 text-white shadow-md hover:bg-primary-600"
            onClick={applyFilters}
            isLoading={loading}
          >
            Terapkan
          </Button>
        </div>
      </Card>

      <Card
        title="Daftar Pengeluaran"
        subtitle={`${meta?.count || 0} transaksi | halaman ${
          pageIndex + 1
        } / ${pageCount}`}
        className="border border-slate-100 shadow-md"
        headerslot={
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1">
              <Icon icon="heroicons-outline:adjustments-vertical" />
              <span>Filter tanggal diterapkan jika diisi</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Tampil</label>
              <select
                className="form-control py-2"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPageIndex(0);
                }}
              >
                {pageSizes.map((size) => (
                  <option key={size} value={size}>
                    {size} / halaman
                  </option>
                ))}
              </select>
            </div>
          </div>
        }
      >
        {loading ? (
          <div className="text-slate-500">Memuat...</div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Transaksi
                  </p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {listData.count}
                  </p>
                  <p className="text-xs text-slate-500">
                    Total record di halaman ini
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-gradient-to-r from-sky-50 to-white px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Total Amount (page)
                  </p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {formatCurrency(
                      totalPageAmount,
                      data?.[0]?.currency || "IDR"
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    Berdasarkan kolom jumlah di halaman ini
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-gradient-to-r from-emerald-50 to-white px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Rentang tanggal
                  </p>
                  <p className="text-sm font-medium text-slate-700">
                    {filters.date_from || filters.date_to
                      ? `${filters.date_from || "..."} → ${
                          filters.date_to || "..."
                        }`
                      : "Tanpa filter tanggal"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Isi tanggal untuk mempersempit hasil
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 flex flex-wrap gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 border border-slate-200">
                    <Icon
                      icon="heroicons-outline:calendar"
                      className="text-base"
                    />
                    {filters.date_from || filters.date_to
                      ? `${filters.date_from || "..."} → ${
                          filters.date_to || "..."
                        }`
                      : "Tanpa filter tanggal"}
                  </span>
                  {filters.search && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 border border-slate-200">
                      <Icon
                        icon="heroicons-outline:magnifying-glass"
                        className="text-base"
                      />
                      {`Cari: ${filters.search}`}
                    </span>
                  )}
                </div>
                <Search
                  searchValue={filters.search}
                  handleSearch={handleSearch}
                />
              </div>
            </div>
            <Table
              listData={listData}
              listColumn={columns}
              handleSearch={handleSearch}
            />
            <PaginationComponent
              pageSize={pageSize}
              pageIndex={pageIndex}
              pageCount={pageCount}
              canPreviousPage={pageIndex > 0}
              canNextPage={pageIndex < pageCount - 1}
              gotoPage={handlePageChange}
              previousPage={() => handlePageChange(pageIndex - 1)}
              nextPage={() => handlePageChange(pageIndex + 1)}
              setPageSize={(size) => {
                setPageSize(size);
                setPageIndex(0);
              }}
            />
          </>
        )}
      </Card>
    </div>
  );
};

const formatCurrency = (value, currency = "IDR") => {
  if (value === null || value === undefined || value === "") return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(value);
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date);
};

export default ExpensePage;
