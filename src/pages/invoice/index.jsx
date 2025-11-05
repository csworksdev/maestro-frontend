import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Table from "@/components/globals/table/table";
import PaginationComponent from "@/components/globals/table/pagination";
import Button from "@/components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  getInvoiceAll,
  DeleteInvoice,
  getInvoiceSummary,
} from "@/axios/invoice"; // ✅ ganti axios ke invoice
import Search from "@/components/globals/table/search";
import SkeletionTable from "@/components/skeleton/Table";
import TableAction from "@/components/globals/table/tableAction";
import { useSelector } from "react-redux";
import { DateTime } from "luxon";
import CopyText from "@/components/custom/copytext";
import {
  XenditCreatePaymentLink,
  XenditRecreatePaymentLink,
  XenditSyncAllTransaction,
  XenditSyncTransaction,
} from "@/axios/xendit";
import { Tab } from "@headlessui/react";
import Badge from "@/components/ui/Badge";

// Komponen badge untuk status
const StatusBadge = ({ status }) => {
  let colorClass = "bg-gray-200 text-gray-700";
  if (status === "SETTLED") {
    colorClass = "bg-green-100 text-green-700 border border-green-400";
  } else if (status === "PAID") {
    colorClass = "bg-yellow-100 text-yellow-700 border border-yellow-400";
  } else if (status === "PENDING") {
    colorClass = "bg-gray-100 text-gray-700 border border-gray-400";
  } else if (status === "EXPIRED" || status === "FAILED") {
    colorClass = "bg-red-100 text-red-700 border border-red-400";
  }

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}
    >
      {status}
    </span>
  );
};

const Invoice = () => {
  const navigate = useNavigate();
  const [listData, setListData] = useState({ count: 0, results: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState(""); // khusus input user di box search
  const [statusFilter, setStatusFilter] = useState("PENDING"); // khusus tab status
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [tabCounts, setTabCounts] = useState({});

  const actions = [
    {
      name: "cek settlement",
      icon: "heroicons:eye",
      onClick: (row) => handleSettlement(row.row.original.external_id),
    },
    {
      name: "Buat Payment Link",
      icon: "heroicons:plus",
      onClick: (row) => recreatePaymentLink(row.row.original),
    },
  ];

  const JenisPembayaran = ["Pending", "Paid", "Settled", "Expired"];

  const fetchData = async ({
    page = pageIndex,
    size = pageSize,
    status = statusFilter,
    search = searchText,
    start = startDate,
    end = endDate,
  } = {}) => {
    try {
      setIsLoading(true);
      const params = {
        page: page + 1,
        page_size: size,
        status: status, // pakai statusFilter
        search: search, // pakai searchText
      };
      if (start) {
        params.start_date = start;
      }
      if (end) {
        params.end_date = end;
      }
      getInvoiceAll(params)
        .then((res) => setListData(res.data))
        .finally(() => setIsLoading(false));
    } catch (error) {
      console.error("Error fetching invoice", error);
    }
  };

  const fetchCounts = async () => {
    try {
      const res = await getInvoiceSummary();
      setTabCounts(res.data.counts);
    } catch (err) {
      console.error("Error fetching counts", err);
    }
  };

  useEffect(() => {
    fetchCounts();
    fetchData();
  }, [pageIndex, pageSize, statusFilter, searchText, startDate, endDate]);

  const handlePageChange = (page) => setPageIndex(page);
  const handlePageSizeChange = (size) => setPageSize(size);

  const handleSearch = (query) => {
    setSearchText(query);
    setPageIndex(0);
  };

  const handleClearDateFilters = () => {
    setStartDate("");
    setEndDate("");
    setPageIndex(0);
  };

  const recreatePaymentLink = async (data) => {
    try {
      const external_id = generateExternalId();
      // data = invoice row.original
      let paramxendit = {
        external_id: external_id, // dari invoice
        amount: parseInt(data.amount, 10), // ambil dari invoice.amount
        description: data.description, // langsung pakai description
        customer_name: data.given_names,
        customer_phone: data.mobile_number,
        items: JSON.parse(data.item).map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: parseInt(item.price, 10),
        })),
      };

      const res = await XenditRecreatePaymentLink(paramxendit);

      if (res?.data) {
        Swal.fire({
          icon: "success",
          title: "Payment Link Berhasil Dibuat",
          text: `Payment link untuk ${data.external_id} berhasil direcreate.`,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal Membuat Payment Link",
          text: "Tidak ada response dari server.",
        });
      }
    } catch (error) {
      console.error("Error recreate payment link:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Terjadi kesalahan saat membuat Payment Link.",
      });
    }
  };

  const handleSettlement = async (reference_id) => {
    try {
      const data = await XenditSyncTransaction(reference_id);

      if (!data || !data.settlement_status) {
        Swal.fire({
          title: "Not Found",
          text: "Data transaksi tidak ditemukan.",
          icon: "warning",
          confirmButtonText: "OK",
        });
        return;
      }

      if (data.settlement_status === "SETTLED") {
        Swal.fire({
          title: "Settlement Success",
          text: `Invoice dengan reference_id ${reference_id} sudah SETTLED.`,
          icon: "success",
          confirmButtonText: "OK",
        });

        // reload data setelah settle
        fetchCounts();
        fetchData({ page: 0, size: 10, status: "PAID" }); // atau gunakan page, size, query dari state
      } else {
        Swal.fire({
          title: "Settlement Pending",
          text: `Status saat ini: ${data.settlement_status}`,
          icon: "info",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "Transaksi tidak ditemukan.",
        icon: "error",
        confirmButtonText: "OK",
      });
      console.error("Error syncing settlement:", error);
    }
  };

  const handleCekAllSettlements = async () => {
    try {
      const data = await XenditSyncAllTransaction();
    } catch (error) {}
  };

  const COLUMNS = [
    {
      Header: "Invoice ID",
      accessor: "external_id",
      Cell: (row) => <CopyText text={row?.cell?.value} />,
    },
    {
      Header: "Order ID",
      accessor: "order_id",
      Cell: (row) => <CopyText text={row?.cell?.value} />,
    },
    {
      Header: "Amount",
      accessor: "grand_total",
      Cell: (row) => (
        <span className="whitespace-nowrap truncate">
          Rp {parseInt(row?.cell?.value).toLocaleString()}
        </span>
      ),
    },
    {
      Header: "Status",
      accessor: "status",
      Cell: (row) => <StatusBadge status={row?.cell?.value} />,
    },
    {
      Header: "Paid At",
      accessor: "pay_at",
      Cell: (row) => {
        return row?.cell?.value
          ? DateTime.fromISO(row?.cell?.value).toFormat("dd LLLL yyyy")
          : "";
      },
    },
    {
      Header: "Deskripsi",
      accessor: "description",
      Cell: (row) => <span>{row?.cell?.value}</span>,
    },
    {
      Header: "Action",
      accessor: "action",
      id: "action",
      sticky: "right",
      Cell: (row) => {
        const externalId = row?.row?.original?.external_id;
        console.log(actions[0]);
        return (
          <div className="flex space-x-2 justify-center items-center">
            {(() => {
              const externalId = row?.row?.original?.external_id;
              const status = row?.row?.original?.status;

              if (
                status === "PAID" &&
                externalId &&
                !externalId.startsWith("cvmaes")
              ) {
                // hanya tampilkan action pertama (index 0)
                return <TableAction action={actions[0]} row={row} />;
              }

              if (
                status === "EXPIRED" &&
                externalId &&
                !externalId.startsWith("cvmaes")
              ) {
                // hanya tampilkan action kedua (index 1)
                return <TableAction action={actions[1]} row={row} />;
              }

              return null; // kalau status lain, kosong
            })()}
          </div>
        );
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 justify-end">
      <Card
        title="Invoice"
        headerslot={
          <Button className="btn-primary " onClick={handleCekAllSettlements}>
            Cek Semua Settlement
          </Button>
        }
      >
        {isLoading ? (
          <SkeletionTable />
        ) : (
          <>
            <Search searchValue={searchText} handleSearch={handleSearch} />
            <div className="flex flex-wrap items-end gap-4 mb-5">
              <div>
                <label
                  htmlFor="start-date-filter"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Start Date
                </label>
                <input
                  id="start-date-filter"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPageIndex(0);
                  }}
                  max={endDate || undefined}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="end-date-filter"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  End Date
                </label>
                <input
                  id="end-date-filter"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPageIndex(0);
                  }}
                  min={startDate || undefined}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  className="btn-outline-primary h-[42px]"
                  onClick={handleClearDateFilters}
                  disabled={!startDate && !endDate}
                >
                  Reset
                </Button>
              </div>
            </div>
            <Tab.Group
              selectedIndex={selectedIndex}
              onChange={(index) => {
                setSelectedIndex(index);
                setStatusFilter(JenisPembayaran[index].toUpperCase()); // tab untuk status
                setPageIndex(0);
              }}
            >
              {/* Tab List */}
              <Tab.List className="flex-nowrap overflow-x-auto whitespace-nowrap flex gap-3 my-4 pb-2">
                {JenisPembayaran.map((item) => (
                  <Tab
                    key={item}
                    className="px-4 py-2 rounded-lg ui-selected:bg-blue-500 ui-selected:text-white flex items-center gap-2"
                  >
                    {item}
                    <span className="text-sm text-gray-500">
                      <Badge
                        label={tabCounts[item.toUpperCase()] ?? 0}
                        className="bg-primary-500 text-white"
                      />
                    </span>
                  </Tab>
                ))}
              </Tab.List>

              {/* Tab Panels */}
              <Tab.Panels>
                {JenisPembayaran.map((item, i) => (
                  <Tab.Panel key={item}>
                    <Table
                      listData={listData}
                      listColumn={COLUMNS}
                      searchValue={searchText}
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
                  </Tab.Panel>
                ))}
              </Tab.Panels>
            </Tab.Group>
          </>
        )}
      </Card>
    </div>
  );
};

export default Invoice;
