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
import Header from "@/components/partials/header";

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
      getXenditBalance()
        .then((res) => {
          setBalanceData(res.data.balance);
        })
        .finally(() => setIsLoading(false));

      // Fetch balance history with filters: from, to, search query (description or reference)
      getXenditBalanceHistory({
        start_date: DateTime.fromISO(from).toFormat("yyyy-MM-dd"),
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

  // Function to copy value to clipboard
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = (value, rowId) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedRowId(rowId);

      // Reset after 1.5 seconds
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
      Cell: (row) => (
        <div className="flex items-center gap-2">
          <span>{row?.cell?.value}</span>
          <button
            onClick={handleCopy}
            className="text-blue-500 hover:text-blue-700 relative transition-transform active:scale-90"
          >
            <Icons
              icon="heroicons-outline:clipboard-copy"
              className={clsx(
                "w-5 h-5 transition-opacity transform",
                isCopied ? "opacity-0 scale-0" : "opacity-100 scale-100"
              )}
            />

            <Icons
              icon="heroicons-outline:check-circle"
              className={clsx(
                "w-5 h-5 text-green-500 absolute top-0 left-0 transition-all transform",
                isCopied
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-50 pointer-events-none"
              )}
            />
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
            <Search searchValue={searchQuery} handleSearch={handleSearch} />
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
