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
  const [isLoading, setIsLoading] = useState(false);

  const [balanceData, setBalanceData] = useState(0);
  const [listData, setListData] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // Searching by description or reference
  const [copiedRowId, setCopiedRowId] = useState(null);
  const [picker3, setPicker3] = useState([]);

  const lineTypeOrder = {
    VAT: 1,
    FEE: 2,
    TRANSACTION: 3,
  };

  const fetchData = async (from, to) => {
    try {
      const balanceRes = await getXenditBalance();
      setBalanceData(balanceRes.data.balance);

      // const dateStart = (idx) =>
      //   picker3[idx]
      //     ? DateTime.fromJSDate(new Date(picker3[idx])).toFormat("yyyy-MM-dd")
      //     : DateTime.now().toFormat("yyyy-MM-dd");

      const historyRes = await getXenditBalanceHistory({
        start_date: from,
        end_date: to,
        currency: "IDR",
        search: searchQuery,
      });

      let sortedSaldos = historyRes.data.results.sort((a, b) => {
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
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  useEffect(() => {
    if (picker3.length === 2) {
      const dateParse = (idx) =>
        DateTime.fromJSDate(new Date(picker3[idx])).toFormat("yyyy-MM-dd");
      fetchData(dateParse(0), dateParse(1));
    }
    if (picker3.length === 0) {
      const defaultDate = DateTime.now().toFormat("yyyy-MM-dd");
      fetchData(defaultDate, defaultDate);
    }
    // }, []);
  }, [searchQuery, JSON.stringify(picker3)]);

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
              {/* {row?.original?.debit_or_credit == "CREDIT"
                ?  */}
              {date.toFormat("dd MMM, yyyy hh:mm")} {/*// : ""*/}
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
    {
      Header: "Sudah Rekap",
      accessor: "is_recap",
      Cell: ({ row }) => (
        <div className="flex items-center gap-2 justify-center text-green-500 font-semibold">
          x
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
            <div className="flex flex-row justify-between gap-3">
              <div>
                <label className="form-label" htmlFor="range-picker">
                  Range
                </label>
                <Flatpickr
                  value={picker3}
                  id="range-picker"
                  // readonly
                  className="w-full py-2 px-3 border border-gray-300 rounded-md bg-white text-gray-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(date) => {
                    setPicker3(date);
                  }}
                  options={{
                    maxDate: "today",
                    dateFormat: "Y-m-d",
                    mode: "range",
                    defaultDate: [new Date(), new Date()],
                  }}
                />
              </div>
              <Search searchValue={searchQuery} handleSearch={handleSearch} />
            </div>
            <Card bodyClass="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {listData?.results &&
                  (() => {
                    // Step 1: Group only DEBIT transactions per date
                    const grouped = listData.results.reduce(
                      (acc, transaction) => {
                        // Validasi amount dan completed_date
                        if (
                          transaction.debit_or_credit === "DEBIT" &&
                          transaction.amount &&
                          !isNaN(transaction.amount) &&
                          transaction.completed_date
                        ) {
                          const isoDate =
                            transaction.completed_date.split("T")[0];
                          const [year, month, day] = isoDate.split("-");
                          const dateKey = `${day}-${month}-${year}`;

                          acc[dateKey] =
                            (acc[dateKey] || 0) + Number(transaction.amount);
                        }
                        return acc;
                      },
                      {}
                    );

                    // Step 2: Render result
                    return Object.entries(grouped).map(([date, total]) => (
                      <div key={date} className="p-4 border rounded shadow">
                        <h3 className="text-lg font-semibold">{date}</h3>
                        <p className="text-gray-700">
                          Total Debit: {total.toLocaleString()}
                        </p>
                      </div>
                    ));
                  })()}
              </div>
            </Card>
            <Table
              listData={listData}
              listColumn={COLUMNS}
              searchValue={searchQuery}
              handleSearch={handleSearch}
              isAction={false}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default XenditBalance;
