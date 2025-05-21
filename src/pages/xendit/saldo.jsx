import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Loading from "@/components/Loading";
import { useNavigate } from "react-router-dom";
import Search from "@/components/globals/table/search";
import { getXenditBalance, getXenditBalanceHistory } from "@/axios/xendit";
import Badge from "@/components/ui/Badge";
import { DateTime } from "luxon";
import Icons from "@/components/ui/Icon";
import PaginationComponent from "@/components/globals/table/pagination";
import clsx from "clsx";
import Table from "@/components/globals/table/table";
import Flatpickr from "react-flatpickr";

const XenditBalance = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [balanceData, setBalanceData] = useState(0);
  const [listData, setListData] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState(""); // Searching by description or reference
  const [fromDate, setFromDate] = useState(
    DateTime.now().minus({ days: 1 }).toISODate()
  );
  const [toDate, setToDate] = useState(DateTime.now().toISODate());
  const [copiedRowId, setCopiedRowId] = useState(null);
  const [picker3, setPicker3] = useState(new Date());
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

  const lineTypeOrder = {
    VAT: 1,
    FEE: 2,
    TRANSACTION: 3,
  };

  const fetchData = async (page, size, query, from, to) => {
    try {
      setIsLoading(true);

      // Fetch balance data (not used in the table but could be displayed separately)
      getXenditBalance().then((res) => {
        setBalanceData(res.data.balance);
      });
      // .finally(() => setIsLoading(false));

      // Fetch balance history with filters: from, to, search query (description or reference)
      await getXenditBalanceHistory({
        start_date: DateTime.fromISO(from)
          .plus({ days: -1 })
          .toFormat("yyyy-MM-dd"),
        end_date: DateTime.fromISO(to).toFormat("yyyy-MM-dd"),
        page: page + 1, // API page index is 1-based
        limit: size,
        currency: "IDR",
        description: query, // Apply search query as description filter
        reference: query, // Apply search query as reference filter
      })
        .then((res) => {
          let sortedSaldos = res.data.results.sort((a, b) => {
            // 1. completed_date DESC
            const dateA = new Date(a.completed_date);
            const dateB = new Date(b.completed_date);
            if (dateA > dateB) return -1;
            if (dateA < dateB) return 1;

            // 2. reference ASC
            if (a.reference < b.reference) return -1;
            if (a.reference > b.reference) return 1;

            // 3. line_type custom order: VAT -> FEE -> TRANSACTION
            const lineTypeA = lineTypeOrder[a.line_type] || 99;
            const lineTypeB = lineTypeOrder[b.line_type] || 99;
            if (lineTypeA < lineTypeB) return -1;
            if (lineTypeA > lineTypeB) return 1;

            // 4. amount ASC (kecil ke besar)
            return a.amount - b.amount;
          });
          setListData({ results: sortedSaldos });
        })
        .catch((error) => {
          console.error("Error fetching data", error);
        })
        .finally(() => setIsLoading(false));
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  useEffect(() => {
    fetchData(pageIndex, pageSize, searchQuery, fromDate, toDate);
  }, [pageIndex, pageSize, searchQuery, fromDate, toDate]);

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

  const handleCopy = (value, rowId) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedRowId(rowId);
      setTimeout(() => setCopiedRowId(null), 1500);
    });
  };

  const formatAmount = (row, type) => {
    if (!row?.original) return "";

    const { debit_or_credit, amount } = row.original;
    const isMatch = debit_or_credit === type;
    const numAmount = Number(amount);

    if (!isMatch || !numAmount) return "";

    const prefix = type === "DEBIT" ? "-" : "+";
    return `${prefix}${numAmount.toLocaleString()}`;
  };

  const COLUMNS = [
    {
      Header: "Tanggal Selesai",
      accessor: "completed_date",
      Cell: (row) => {
        const date = DateTime.fromISO(row?.cell?.value);
        return (
          <div className="flex items-center gap-2">
            <span>
              {date.isValid ? date.toFormat("dd MMM, yyyy hh:mm") : "-"}
            </span>
            {/* <button
              onClick={() => handleCopy(row?.cell?.value)}
              className="text-blue-500 hover:text-blue-700"
            >
              <Icons
                icon="heroicons-outline:clipboard-copy"
                className="w-5 h-5"
              />
            </button> */}
          </div>
        );
      },
    },
    {
      Header: "Tipe Transaksi",
      accessor: "transaction_type",
      Cell: (row) => (
        <div className="flex items-center gap-2">
          <span>{row?.cell?.value}</span>
          {/* <button
            onClick={() => handleCopy(row?.cell?.value)}
            className="text-blue-500 hover:text-blue-700"
          >
            <Icons
              icon="heroicons-outline:clipboard-copy"
              className="w-5 h-5"
            />
          </button> */}
        </div>
      ),
    },
    {
      Header: "Channel",
      accessor: "payment_channel",
      Cell: (row) => (
        <div className="flex items-center gap-2">
          <span>{row?.cell?.value}</span>
          {/* <button
            onClick={() => handleCopy(row?.cell?.value)}
            className="text-blue-500 hover:text-blue-700"
          >
            <Icons
              icon="heroicons-outline:clipboard-copy"
              className="w-5 h-5"
            />
          </button> */}
        </div>
      ),
    },
    {
      Header: "Referensi",
      accessor: "reference",
      Cell: ({ cell, row }) => (
        <div className="flex items-center gap-2">
          <span>{cell.value}</span>
          <button
            onClick={() => handleCopy(cell.value, row.id)} // gunakan row.id di sini
            className="text-blue-500 hover:text-blue-700 relative transition-transform active:scale-90"
          >
            <Icons
              icon="heroicons-outline:clipboard-copy"
              className={clsx(
                "w-5 h-5 transition-opacity transform"
                // kamu bisa tambah animasi di sini kalau mau
              )}
            />

            {copiedRowId === row.id && (
              <span style={{ marginLeft: 5, color: "green" }}>Copied!</span>
            )}
          </button>
        </div>
      ),
    },
    {
      Header: "Debit",
      accessor: "debit",
      Cell: ({ row }) => (
        <div className="flex items-center gap-2 justify-end text-red-800 font-semibold">
          {formatAmount(row, "DEBIT")}
        </div>
      ),
    },
    {
      Header: "Credit",
      accessor: "credit",
      Cell: ({ row }) => (
        <div className="flex items-center gap-2 justify-end text-green-500 font-semibold">
          {formatAmount(row, "CREDIT")}
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3">
      <Card title={"Saldo Tersedia"}>
        <span className="font-bold text-xl">
          {"IDR " + balanceData.toLocaleString() ?? 0}
        </span>
      </Card>
      <Card title="">
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <div className="flex flex-col justify-between gap-3">
              <div>
                <label className="form-label" for="range-picker">
                  Range
                </label>
                <Flatpickr
                  value={picker3}
                  id="range-picker"
                  className="form-control py-2"
                  onChange={(date) => {
                    setPicker3(date);
                    setFromDate(
                      DateTime.fromISO(date[0]).toFormat("yyyy-MM-dd")
                    );
                    setToDate(DateTime.fromISO(date[1]).toFormat("yyyy-MM-dd"));
                  }}
                  options={{
                    mode: "range",
                    defaultDate: [
                      DateTime.now().plus({ days: -1 }).toISODate(),
                      DateTime.now().toISODate(),
                    ],
                  }}
                />
              </div>
              <Search searchValue={searchQuery} handleSearch={handleSearch} />
            </div>
            <Table
              listData={listData}
              listColumn={COLUMNS}
              searchValue={searchQuery}
              handleSearch={handleSearch}
              isAction={false}
            />
            {/* Pagination if needed */}
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

export default XenditBalance;
