import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Table from "@/components/globals/table/table";
import Loading from "@/components/Loading";
import { useLocation, useNavigate } from "react-router-dom";
import Search from "@/components/globals/table/search";
import PaginationComponent from "@/components/globals/table/pagination";
import { getOrderByTrainer } from "@/axios/rekap/pelatih";
import Button from "@/components/ui/Button";
import { Outlet } from "react-router-dom";
import TableAction from "@/components/globals/table/tableAction";

const RekapOrderTrainer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data = {} } = location.state ?? {};
  const [isLoading, setIsLoading] = useState(true);

  const [listData, setListData] = useState({ count: 0, results: [] });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const actions = [
    {
      name: "detail",
      icon: "heroicons-outline:eye",
      onClick: (row) => handleDetail(row.row.original),
      className:
        "bg-success-500 text-success-500 bg-opacity-30 hover:bg-opacity-100 hover:text-white",
    },
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

  const fetchData = async (page, size, query) => {
    try {
      setIsLoading(true);
      setListData();
      const params = {
        page: page + 1,
        page_size: size,
        is_finish: false,
        search: query,
      };
      getOrderByTrainer(data.trainer_id, params)
        .then((res) => {
          const updateData = res.data.results.map((item) => ({
            ...item,
            listname: item.students.map((i) => i.student_fullname).join(", "),
          }));

          res = {
            ...res,
            data: {
              ...res.data,
              results: updateData,
            },
          };
          setListData(res.data);
        })
        .catch((error) => {
          console.error("Error fetching order data:", error);
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
    navigate("/app/order/detail", {
      state: {
        data: e,
      },
    });
  };

  const handleEdit = (e) => {
    navigate("/app/order/edit", {
      state: {
        isupdate: "true",
        data: e,
      },
    });
  };

  const COLUMNS = [
    {
      Header: "Siswa",
      accessor: "listname",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },

    {
      Header: "Kolam",
      accessor: "pool_name",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Produk",
      accessor: "product_name",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Tanggal Order",
      accessor: "order_date",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Hari (Jadwal)",
      accessor: "day",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Jam (Jadwal)",
      accessor: "time",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    // {
    //   Header: "Promo",
    //   accessor: "promo",
    //   Cell: (row) => {
    //     return <span>{row?.cell?.value}</span>;
    //   },
    // },
    // {
    //   Header: "Harga",
    //   accessor: "grand_total",
    //   Cell: (row) => {
    //     return <span>{row?.cell?.value}</span>;
    //   },
    // },
    // {
    //   Header: "Pelatih",
    //   accessor: "trainer_name",
    //   Cell: (row) => {
    //     return <span>{row?.cell?.value}</span>;
    //   },
    // },
    {
      Header: "action",
      accessor: "action",
      id: "action",
      sticky: "right",
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
      <Card title="Rekap Order Per Pelatih" subtitle={data.fullname}>
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <Button
              text="Kembali"
              onClick={() => navigate(-1)}
              className="bg-primary-500 text-white mb-4"
              icon="heroicons-outline:arrow-uturn-left"
            />
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
      <Outlet />
    </div>
  );
};

export default RekapOrderTrainer;
