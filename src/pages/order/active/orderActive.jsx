import React, { Fragment, useRef, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { Tab, Disclosure, Transition, Menu } from "@headlessui/react";
import Table from "@/components/globals/table/table";
import Loading from "@/components/Loading";
import Dropdown from "@/components/ui/Dropdown";
import Button from "@/components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { DeleteOrder, getOrderAll } from "@/axios/masterdata/order";
import Search from "@/components/globals/table/search";
import PaginationComponent from "@/components/globals/table/pagination";

const OrderActive = ({ is_finished }) => {
  const navigate = useNavigate();
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
        is_finish: is_finished,
        search: query,
      };
      getOrderAll(params)
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
        DeleteOrder(e.order_id).then((res) => {
          if (res.status) {
            Swal.fire("Deleted!", "Your file has been deleted.", "success");
            fetchData(pageIndex, pageSize, searchQuery);
          }
        });
      }
    });
  };

  const handleDetail = (e) => {
    navigate("detail", {
      state: {
        data: e,
      },
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

  const getClassName = (action) =>
    action.className
      ? action.className
      : "hover:bg-slate-900 hover:text-white dark:hover:bg-slate-600 dark:hover:bg-opacity-50";

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
    {
      Header: "Promo",
      accessor: "promo",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Harga",
      accessor: "grand_total",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Pelatih",
      accessor: "trainer_name",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "action",
      accessor: "action",
      Cell: (row) => {
        return (
          <div className="flex space-x-2 items-center">
            <div className="flex space-x-2">
              {actions.map((action, index) => (
                <div
                  className={`
      ${getClassName(action)}
      w-full border-b border-b-gray-500 border-opacity-10 px-4 py-2 text-sm last:mb-0 cursor-pointer 
      first:rounded-t last:rounded-b flex space-x-2 items-center rtl:space-x-reverse
    `}
                  onClick={(e) => action.onClick && action.onClick(row)}
                  key={index}
                >
                  <span className="text-base">
                    <Icon icon={action.icon} />
                  </span>
                  <span>{action.name}</span>
                </div>
              ))}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <>
      {is_finished === false ? (
        <Button className="btn-primary ">
          <Link to="add" isupdate="false">
            Tambah
          </Link>
        </Button>
      ) : null}
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
    </>
  );
};

export default OrderActive;
