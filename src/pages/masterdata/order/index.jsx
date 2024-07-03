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

const actions = [
  // {
  //   name: "view",
  //   icon: "heroicons-outline:eye",
  // },
  // {
  //   name: "edit",
  //   icon: "heroicons:pencil-square",
  // },
  {
    name: "delete",
    icon: "heroicons-outline:trash",
  },
];

const Order = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = () => {
    setIsLoading(true);
    getOrderAll()
      .then((res) => {
        setData(res.data.results);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

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
            loadData();
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
      accessor: "student_name",
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
                  onClick={(e) =>
                    item.name === "edit"
                      ? handleEdit(row.row.original)
                      : handleDelete(row.row.original)
                  }
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
    <div className="grid grid-cols-1 justify-end">
      <Card title="Order">
        <Button className="btn-primary ">
          <Link to="add" isupdate="false">
            Tambah
          </Link>
        </Button>
        {isLoading ? (
          <Loading />
        ) : (
          <Table listData={data} listColumn={COLUMNS} />
        )}
      </Card>
    </div>
  );
};

export default Order;
