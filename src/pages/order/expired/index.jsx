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
import { DeleteOrder, getOrderExpired } from "@/axios/masterdata/order";
import Search from "@/components/globals/table/search";
import PaginationComponent from "@/components/globals/table/pagination";

const actions = [
  // {
  //   name: "view",
  //   icon: "heroicons-outline:eye",
  // },
  {
    name: "edit",
    icon: "heroicons:pencil-square",
  },
  // {
  //   name: "delete",
  //   icon: "heroicons-outline:trash",
  // },
];

const OrderActive = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const [listData, setListData] = useState({ count: 0, results: [] });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async (page, size, query) => {
    try {
      setIsLoading(true);
      setListData();
      const params = {
        page: page + 1,
        page_size: size,
        search: query,
      };
      getOrderExpired(params)
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

  const handleEdit = (e) => {
    navigate("edit", {
      state: {
        isupdate: "true",
        data: e,
      },
    });
  };

  const COLUMNS = [
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
      Header: "Promo",
      accessor: "promo",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Harga",
      accessor: "price",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Siswa",
      accessor: "listname",
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
      id: "action",
      sticky: "right",
      Cell: (row) => {
        return (
          <div className="flex space-x-2 items-center">
            <div className="flex space-x-2">
              {actions.map((item, i) => (
                <div
                  className={`
                  
                    ${
                      item.name === "delete"
                        ? "bg-danger-500 text-danger-500 bg-opacity-30   hover:bg-opacity-100 hover:text-white"
                        : "hover:bg-slate-900 hover:text-white dark:hover:bg-slate-600 dark:hover:bg-opacity-50"
                    }
                     w-full border-b border-b-gray-500 border-opacity-10 px-4 py-2 text-sm  last:mb-0 cursor-pointer 
                     first:rounded-t last:rounded-b flex  space-x-2 items-center rtl:space-x-reverse `}
                  onClick={
                    (e) =>
                      // item.name === "edit"
                      // ?
                      handleEdit(row.row.original)
                    // : handleDelete(row.row.original)
                  }
                  key={i}
                >
                  <span className="text-base">
                    <Icon icon={item.icon} />
                  </span>
                  <span>{item.name}</span>
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
      {isLoading ? (
        <Loading />
      ) : (
        <Card title={"Order Expired"}>
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
        </Card>
      )}
    </>
  );
};

export default OrderActive;
