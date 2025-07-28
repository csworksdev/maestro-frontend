import React, { useEffect, useState } from "react";
import Table from "@/components/globals/table/table";
import Loading from "@/components/Loading";
import Button from "@/components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { DeleteOrder, getOrderAll } from "@/axios/masterdata/order";
import Search from "@/components/globals/table/search";
import PaginationComponent from "@/components/globals/table/pagination";
import TableAction from "@/components/globals/table/tableAction";
import Modal from "@/components/ui/Modal";
import DetailOrder from "./detail";
import Edit from "./edit";
import { Icon } from "@iconify/react";
import Tooltip from "@/components/ui/Tooltip";
import { DateTime } from "luxon";
import { useSelector } from "react-redux";
import { toProperCase } from "@/utils";
import EditModal from "./editModal";

const OrderActive = ({ is_finished }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const [listData, setListData] = useState({ count: 0, results: [] });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isEdited, setisEdited] = useState(false);
  const [modalData, setModalData] = useState(null);

  const { roles } = useSelector((state) => state.auth.data);

  const actionsAdmin = [
    {
      name: "edit",
      icon: "heroicons:pencil-square",
      onClick: (row) => handleEdit(row.row.original),
    },
  ];

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

  const fetchData = async (page = 1, size = 10, query) => {
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

  useEffect(() => {
    if (!editModalVisible && isEdited) {
      fetchData(pageIndex, pageSize, searchQuery);
      setisEdited(!isEdited);
    }
  }, [editModalVisible]);

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
    setDetailModalVisible(true); // Open the modal
    setModalData(e); // Pass data to the modal
  };

  const handleEdit = (e) => {
    setEditModalVisible(true); // Open the modal
    setModalData(e); // Pass data to the modal
  };

  const COLUMNS = [
    {
      Header: "Admin",
      accessor: "create_by_username",
      id: "create_by_username",
      Cell: (row) => {
        return <span>{toProperCase(row?.cell?.value)}</span>;
      },
    },
    {
      Header: "Pelatih",
      accessor: "trainer_name",
      id: "trainer_name",
      Cell: (row) => {
        return <span>{toProperCase(row?.cell?.value)}</span>;
      },
    },
    {
      Header: "Siswa",
      accessor: "listname",
      id: "listname",
      Cell: (row) => {
        return (
          <div>
            {row?.cell?.value.split(",").map((substring, idx) => {
              return (
                <div className="flex flex-row gap-1" key={idx}>
                  <div className="p-0 mr-1">{idx + 1}.</div>
                  <div className="text-wrap p-0">
                    {toProperCase(substring).trim()}
                  </div>
                  <br />
                </div>
              );
            })}
          </div>
        );
      },
    },
    {
      Header: "Produk",
      accessor: "product_name",
      id: "product_name",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Harga",
      accessor: "grand_total",
      id: "grand_total",
      Cell: (row) => {
        let number = parseFloat(row?.cell?.value);
        return <span>{number.toLocaleString("IDR")}</span>;
      },
    },
    {
      Header: "Tanggal Order",
      accessor: "order_date",
      id: "order_date",
      Cell: (row) => {
        return (
          <span>
            {DateTime.fromISO(row?.cell?.value).toFormat("d MMMM yyyy")}
          </span>
        );
      },
    },
    {
      Header: "Tanggal Kadaluwarsa",
      accessor: "expire_date",
      id: "expire_date",
      Cell: (row) => {
        return (
          <span>
            {row?.cell?.value !== null
              ? DateTime.fromISO(row?.cell?.value).toFormat("d MMMM yyyy")
              : ""}
          </span>
        );
      },
    },
    {
      Header: "Hari (Jadwal)",
      accessor: "day",
      id: "day",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Jam (Jadwal)",
      accessor: "time",
      id: "time",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Pertemuan",
      accessor: "detail",
      id: "detail",
      width: 200,
      Cell: (row) => {
        let data = row?.cell?.value;
        const unique = [
          ...data.reduce((a, c) => a.set(c.meet, c), new Map()).values(),
        ];

        return (
          <div className="flex flex-col">
            {unique
              .sort((a, b) => a.meet - b.meet)
              .map((item, index) => (
                <div
                  className="flex flex-row text-center justify-center text-nowrap items-center gap-1"
                  key={index}
                >
                  {item.real_date !== null ? (
                    <>
                      <span>
                        {item.meet}. {item.real_date}
                      </span>
                      <span>
                        {item.is_presence ? (
                          <Tooltip
                            placement="top"
                            arrow
                            content={"Sudah Absen"}
                          >
                            <div
                              className={`w-full border-b border-b-gray-500 border-opacity-10 py-2 text-sm last:mb-0 cursor-pointer 
                      first:rounded-t last:rounded-b flex space-x-2 items-center rtl:space-x-reverse
                    `}
                              key={index}
                            >
                              <span className="text-base">
                                <Icon
                                  icon="heroicons-outline:check"
                                  color="green"
                                  style={{ height: "20px", width: "20px" }}
                                />
                              </span>
                            </div>
                          </Tooltip>
                        ) : null}
                      </span>
                      <span>
                        {item.is_paid ? (
                          <Tooltip
                            placement="top"
                            arrow
                            content={"Sudah dibayar"}
                          >
                            <div
                              className={`w-full border-b border-b-gray-500 border-opacity-10 py-2 text-sm last:mb-0 cursor-pointer 
                        first:rounded-t last:rounded-b flex space-x-2 items-center rtl:space-x-reverse
                      `}
                              key={index}
                            >
                              <span className="text-base">
                                <Icon
                                  icon="heroicons-outline:currency-dollar"
                                  color="green"
                                  style={{ height: "20px", width: "20px" }}
                                />
                              </span>
                            </div>
                          </Tooltip>
                        ) : null}
                      </span>
                    </>
                  ) : (
                    "[...]"
                  )}
                </div>
              ))}
          </div>
        );
      },
    },
    {
      Header: "action",
      accessor: "action",
      id: "action",
      sticky: "right",
      Cell: (row) => {
        return (
          <div className="flex flex-row space-x-2 justify-center items-center">
            {(roles === "Admin" ? actionsAdmin : actions).map(
              (action, index) => (
                <TableAction action={action} index={index} row={row} />
              )
            )}
          </div>
        );
      },
    },
  ];

  const fixColumn = () => {
    let newData = [...COLUMNS];
    if (is_finished) newData.splice(-1);
    return newData;
  };

  const updatedListData = (newData) => {
    let data = [...listData.results];

    let temp = {
      ...listData,
      results: data.map((item) => ({
        ...item,
        detail: item.detail.map((itemdetail) => ({
          ...itemdetail,
          is_presence:
            itemdetail.order_detail_id === newData.order_detail_id
              ? newData.is_presence
              : itemdetail.is_presence,
          is_paid:
            itemdetail.order_detail_id === newData.order_detail_id
              ? newData.is_paid
              : itemdetail.is_paid,
        })),
      })),
    };
    setListData(temp);
  };

  return (
    <>
      {/* {is_finished === false ? (
        <Button className="btn-primary ">
          <Link to="add" isupdate="false">
            Tambah
          </Link>
        </Button>
      ) : null} */}
      {isLoading ? (
        <Loading />
      ) : (
        <>
          <Search searchValue={searchQuery} handleSearch={handleSearch} />
          <Table
            listData={listData}
            listColumn={fixColumn()}
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
          {detailModalVisible && (
            <Modal
              title="Detail Order"
              activeModal={detailModalVisible} // Tie to modalVisible state
              onClose={() => setDetailModalVisible(false)} // Close modal when needed
              className="max-w-5xl"
            >
              <DetailOrder
                state={{ data: modalData }}
                updateParentData={updatedListData}
              />
            </Modal>
          )}
          {editModalVisible && (
            <Modal
              title="Edit Order"
              activeModal={editModalVisible} // Tie to modalVisible state
              onClose={() => setEditModalVisible(false)} // Close modal when needed
              className="max-w-5xl"
            >
              <EditModal
                defaultOrder={modalData}
                onClose={() => setEditModalVisible(false)}
                isEdit={(e) => setisEdited(e)}
              />
              {/* <Edit
                state={{ data: modalData }}
                onClose={() => setEditModalVisible(false)}
              /> */}
            </Modal>
          )}
        </>
      )}
    </>
  );
};

export default OrderActive;
