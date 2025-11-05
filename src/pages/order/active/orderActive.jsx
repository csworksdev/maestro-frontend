import React, { useEffect, useState } from "react";
import Table from "@/components/globals/table/table";
import Loading from "@/components/Loading";
import Button from "@/components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  DeleteOrder,
  getOrderAll,
  PerpanjangOrder,
} from "@/axios/masterdata/order";
import Search from "@/components/globals/table/search";
import PaginationComponent from "@/components/globals/table/pagination";
import TableAction from "@/components/globals/table/tableAction";
import Modal from "@/components/ui/Modal";
import DetailOrder from "./detail";
import { Icon } from "@iconify/react";
import Tooltip from "@/components/ui/Tooltip";
import { DateTime } from "luxon";
import { toProperCase } from "@/utils";
import EditModal from "./editModal";
import { useAuthStore } from "@/redux/slicers/authSlice";
import MutasiSiswaModal from "./mutasiSiswa";

const ACTION_SHARED_CLASS = "shadow-sm transition-colors";

const ACTION_INTENTS = {
  success:
    "bg-success-500/15 text-success-600 hover:bg-success-500 hover:text-white dark:bg-success-500/20 dark:text-success-200",
  info: "bg-info-500/15 text-info-600 hover:bg-info-500 hover:text-white dark:bg-info-500/20 dark:text-info-200",
  warning:
    "bg-warning-500/15 text-warning-600 hover:bg-warning-500 hover:text-white dark:bg-warning-500/20 dark:text-warning-200",
  pink: "bg-pink-500/15 text-pink-600 hover:bg-pink-500 hover:text-white dark:bg-pink-500/20 dark:text-pink-200",
  danger:
    "bg-danger-500/15 text-danger-600 hover:bg-danger-500 hover:text-white dark:bg-danger-500/20 dark:text-danger-200",
  neutral:
    "bg-slate-200 text-slate-600 hover:bg-slate-500 hover:text-white dark:bg-slate-600/60 dark:text-slate-200",
};

const composeActionClass = (intent = "neutral") =>
  `${ACTION_SHARED_CLASS} ${ACTION_INTENTS[intent] || ACTION_INTENTS.neutral}`;

const OrderActive = ({ is_finished }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const [listData, setListData] = useState({ count: 0, results: [] });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [mutasiModalVisible, setMutasiModalVisible] = useState(false);
  const [isEdited, setisEdited] = useState(false);
  const [modalData, setModalData] = useState(null);

  const { roles } = useAuthStore((state) => state.data);

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

  const handleMutasi = (e) => {
    setMutasiModalVisible(true); // Open the modal
    setModalData(e); // Pass data to the modal
  };

  const handlePerpanjang = async (e) => {
    const { value: order_date } = await Swal.fire({
      title: "Perpanjang paket ",
      text: `Siswa ${toProperCase(
        e.listname
      )} akan diperpanjang ? jika Ya, silahkan isi tanggal ordernya`,
      input: "date",
      icon: "question",
      didOpen: () => {
        const today = new Date().toISOString();
        Swal.getInput().max = today.split("T")[0];
      },
    });

    if (order_date) {
      // console.log(order_date);
      Swal.fire({
        title: "Perpanjang paket ",
        text: `Siswa ${toProperCase(
          e.listname
        )} akan diperpanjang ke tanggal ${order_date} ?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#22c55e",
        cancelButtonColor: "#ef4444",
        confirmButtonText: "Perpanjang",
      }).then(async (result) => {
        if (result.isConfirmed) {
          let res = await PerpanjangOrder(e.order_id, order_date);
          if (res) {
            fetchData(pageIndex, pageSize, searchQuery);
          }
        }
      });
    }
  };

  const actionBlueprints = [
    {
      name: "detail",
      icon: "heroicons-outline:eye",
      intent: "success",
      handler: handleDetail,
    },
    {
      name: "edit",
      icon: "heroicons:pencil-square",
      intent: "info",
      handler: handleEdit,
    },
    {
      name: "Mutasi Siswa",
      icon: "heroicons:arrow-right",
      intent: "warning",
      handler: handleMutasi,
    },
    {
      name: "Perpanjang Paket",
      icon: "heroicons:heart",
      intent: "pink",
      handler: handlePerpanjang,
    },
    {
      name: "delete",
      icon: "heroicons-outline:trash",
      intent: "danger",
      handler: handleDelete,
    },
  ];

  const actions = actionBlueprints.map((action) => ({
    name: action.name,
    icon: action.icon,
    onClick: (row) => action.handler(row.row.original),
    className: composeActionClass(action.intent),
  }));

  const actionsAdmin = actions;

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
      Cell: ({ cell, row }) => {
        const originalTrainer = toProperCase(cell?.value || "-");
        const changedTrainerRaw = row?.original?.change_trainer_name;
        const changedTrainer = changedTrainerRaw
          ? toProperCase(changedTrainerRaw)
          : "";
        const hasChange =
          Boolean(changedTrainer) &&
          changedTrainer.toLowerCase() !== originalTrainer.toLowerCase();

        return (
          <div className="flex flex-col gap-2 text-left">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                <Icon icon="heroicons-outline:user" width={18} />
              </span>
              <div className="flex flex-col">
                <span className="font-semibold">{originalTrainer}</span>
                {hasChange && (
                  <span className="text-xs font-medium uppercase tracking-wide text-amber-500">
                    sebelumnya
                  </span>
                )}
              </div>
            </div>
            {hasChange && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20">
                  <Icon icon="heroicons-outline:arrow-right" width={18} />
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    Mutasi ke
                  </span>
                  <span className="text-sm font-semibold">{changedTrainer}</span>
                </div>
              </div>
            )}
          </div>
        );
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
      Header: "Kolam",
      accessor: "pool_name",
      id: "pool_name",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
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
          <div className="flex flex-wrap gap-2 justify-center items-center">
            {(roles == "Admin" ? actionsAdmin : actions).map(
              (action, index) => (
                <TableAction
                  key={action.id || index} // 👈 kasih key DI SINI
                  action={action}
                  row={row}
                />
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
            </Modal>
          )}
          {mutasiModalVisible && (
            <Modal
              title="Mutasi siswa ke pelatih baru"
              activeModal={mutasiModalVisible} // Tie to modalVisible state
              onClose={() => setMutasiModalVisible(false)} // Close modal when needed
              className="max-w-5xl"
            >
              <MutasiSiswaModal
                defaultOrder={modalData}
                onClose={() => setMutasiModalVisible(false)}
                isEdit={(e) => setisEdited(e)}
              />
            </Modal>
          )}
        </>
      )}
    </>
  );
};

export default OrderActive;
