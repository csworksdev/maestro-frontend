import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Loading from "@/components/Loading";
import { useNavigate } from "react-router-dom";
import Search from "@/components/globals/table/search";
import {
  downloadXenditInvoiceHistory,
  getXenditInvoiceHistory,
} from "@/axios/xendit";
import Table from "@/components/globals/table/table";
import TableAction from "@/components/globals/table/tableAction";
import Badge from "@/components/ui/Badge";
import { DateTime } from "luxon";
import { downloadBlobResponse } from "@/utils/blob-download";

const getInvoiceId = (invoice) =>
  invoice?.invoice_id || invoice?.id || invoice?.xendit_invoice_id;

const normalizeInvoiceHistoryData = (payload) => {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) {
    return {
      count: data.length,
      results: data,
    };
  }

  if (Array.isArray(data?.results)) {
    return {
      count: data.count ?? data.results.length,
      results: data.results,
    };
  }

  if (Array.isArray(data?.data)) {
    return {
      count: data.count ?? data.data.length,
      results: data.data,
    };
  }

  return {
    count: 0,
    results: [],
  };
};

const XenditInvoiceHistory = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);

  const [listData, setListData] = useState({ count: 0, results: [] });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async (page, size, query) => {
    try {
      setIsLoading(true);
      const params = {
        page: page + 1,
        page_size: size,
        search: query,
      };
      const res = await getXenditInvoiceHistory(params);
      setListData(normalizeInvoiceHistoryData(res.data));
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setIsLoading(false);
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

  const handlePreview = (invoice) => {
    const invoiceId = getInvoiceId(invoice);
    if (!invoiceId) {
      return;
    }

    navigate(`/xendit/invoice-history/${invoiceId}`);
  };

  const handleDownload = async (invoice) => {
    const invoiceId = getInvoiceId(invoice);
    if (!invoiceId) {
      return;
    }

    try {
      setDownloadingInvoiceId(invoiceId);
      const response = await downloadXenditInvoiceHistory(invoiceId);
      downloadBlobResponse(response, `invoice-${invoiceId}.pdf`);
    } catch (error) {
      console.error("Error downloading invoice", error);
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const COLUMNS = [
    {
      Header: "Status",
      accessor: "status",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Tanggal Pembayaran",
      accessor: "pay_at",
      Cell: (row) => {
        const date = DateTime.fromISO(row?.cell?.value);
        return (
          <span>
            {date.isValid ? date.toFormat("dd MMM, yyyy hh:mm") : "-"}
          </span>
        );
      },
    },
    {
      Header: "External Id",
      accessor: "external_id",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Deskripsi",
      accessor: "description",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Jumlah",
      accessor: "paid_amount",
      Cell: (row) => {
        return (
          <span className="text-right">
            {isNaN(parseFloat(row?.cell?.value))
              ? "-"
              : parseFloat(row.cell.value).toLocaleString()}
          </span>
        );
      },
    },
    {
      Header: "Item",
      accessor: "items",
      Cell: (row) => {
        return (
          <div className="flex flex-col gap-2">
            {(row?.cell?.value || []).map((item, index) => (
              <Badge key={`${item?.name || "item"}-${index}`}>
                <div className="flex flex-col">
                  <div>Produk : {item.name}</div>
                  <div>Harga : {parseFloat(item.price).toLocaleString()}</div>
                  <div>
                    Jumlah : {parseFloat(item.quantity).toLocaleString()}
                  </div>
                </div>
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      Header: "Customer",
      accessor: "customer",
      Cell: (row) => {
        const { given_names, mobile_number } = row?.cell?.value || {};
        return (
          <div className="flex flex-col">
            <span>{given_names}</span>
            <span>{mobile_number ?? null}</span>
          </div>
        );
      },
    },
    {
      Header: "Aksi",
      accessor: "action",
      disableSortBy: true,
      disableHiding: true,
      Cell: ({ row }) => {
        const invoice = row?.original;
        const invoiceId = getInvoiceId(invoice);
        const isDownloading = downloadingInvoiceId === invoiceId;

        return (
          <div className="flex items-center justify-center gap-2">
            <TableAction
              row={row}
              action={{
                name: "Preview",
                icon: "heroicons-outline:eye",
                onClick: () => handlePreview(invoice),
              }}
            />
            <TableAction
              row={row}
              action={{
                name: isDownloading ? "Downloading" : "Download",
                icon: "heroicons-outline:arrow-down-tray",
                onClick: () => handleDownload(invoice),
                className:
                  "hover:border-success-300 hover:bg-success-50 hover:text-success-700 dark:hover:border-success-500/50 dark:hover:bg-success-500/10",
              }}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 justify-end">
      <Card title="Tautan Pembayaran (Invoice)">
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <Search searchValue={searchQuery} handleSearch={handleSearch} />
            <Table
              tableId={"xendit-invoice-history-table"}
              listData={listData}
              listColumn={COLUMNS}
              searchValue={searchQuery}
              handleSearch={handleSearch}
            />
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

export default XenditInvoiceHistory;
