import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Table from "@/components/globals/table/table";
import { useNavigate } from "react-router-dom";
import { getTrainerAll } from "@/axios/masterdata/trainer";
import TableAction from "@/components/globals/table/tableAction";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { getPeriodisasiAll } from "@/axios/referensi/periodisasi";
import Select from "@/components/ui/Select";
import {
  BayarPelatihByTrainer,
  ExportRekapBulanan,
  getRekapByTrainer,
} from "@/axios/rekap/bulanan";
import Swal from "sweetalert2";
import { DeleteOrder, getOrderById } from "@/axios/masterdata/order";
import SkeletionTable from "@/components/skeleton/Table";
import { Icon } from "@iconify/react";
import Tooltip from "@/components/ui/Tooltip";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import DetailOrder from "@/pages/order/active/detail";
import { DateTime } from "luxon";
import { forEach, toInteger, toString } from "lodash";
import EditModal from "@/pages/order/active/editModal";

const RekapBulanan = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [listTrainer, setListTrainer] = useState([]);
  const [listPeriode, setListPeriode] = useState([]);
  const [listData, setListData] = useState({ results: [] });
  const [searchQuery, setSearchQuery] = useState("");
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isEdited, setisEdited] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [isDownload, setIsDownload] = useState(false);
  const [unpaidList, setUnpaidList] = useState({});
  const [selectedTrainer, setSelectedTrainer] = useState("");
  const [selectedPeriode, setSelectedPeriode] = useState("");
  const [summary, setSummary] = useState({
    prevCount: 0,
    prevPrice: 0,
    currCountPaid: 0,
    currPricePaid: 0,
    currCountUnpaid: 0,
    currPriceUnpaid: 0,
    nextCount: 0,
    nextPrice: 0,
  });

  const validationSchema = yup.object({
    trainer: yup.string().required("Coach is required"),
    periode: yup.string().required("Periode is required"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const actions = [
    {
      name: "Bayar",
      icon: "heroicons-outline:banknotes",
      onClick: (row) => handleBayarPerOrder(row.row.original),
      className:
        "bg-warning-500 text-warning-500 bg-opacity-30 hover:bg-opacity-100 hover:text-white",
    },
    {
      name: "edit",
      icon: "heroicons-outline:pencil-square",
      onClick: (row) => handleEdit(row.row.original),
      className:
        "bg-danger-500 text-danger-500 bg-opacity-30 hover:bg-opacity-100 hover:text-white",
    },
    {
      name: "Detail",
      icon: "heroicons-outline:eye",
      onClick: (row) => handleDetail(row.row.original),
      // navigate("detailorderpelatih", { state: { data: row.row.original } }),
      className:
        "bg-success-500 text-success-500 bg-opacity-30 hover:bg-opacity-100 hover:text-white",
    },
  ];

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const trainerParams = { page: 1, page_size: 100, search: searchQuery };

      const trainerResponse = await getTrainerAll(trainerParams);
      let trainerOptions = trainerResponse.data.results;
      setListTrainer(trainerOptions);

      const periodeResponse = await getPeriodisasiAll(trainerParams);
      let periodeOptions = periodeResponse.data.results;
      setListPeriode(periodeOptions);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRekapData = async () => {
    try {
      setIsLoading(true);
      setSummary({
        prevCount: 0,
        prevPrice: 0,
        currCount: 0,
        currPrice: 0,
        nextCount: 0,
        nextPrice: 0,
      });

      const response = await getRekapByTrainer(
        selectedPeriode[0].name,
        selectedTrainer[0].trainer_id
      );
      setListData(response.data);
      reSummarize();
    } catch (error) {
      console.error("Error fetching rekap data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const reSummarize = async () => {
    try {
      setSummary({
        prevCount: 0,
        prevPrice: 0,
        currCountPaid: 0,
        currPricePaid: 0,
        currCountUnpaid: 0,
        currPriceUnpaid: 0,
        nextCount: 0,
        nextPrice: 0,
      });
      let unpaidOrderId = [];

      listData.results.map((item) => {
        for (let index = 1; index <= 8; index++) {
          var objDate = "p" + index;
          var objNamePaid = "p" + index + "_paid";
          var objNameOrderID = "p" + index + "_order_detail_id";

          if (item[objDate] !== "") {
            if (
              DateTime.fromFormat(item[objDate], "dd/MM/yyyy") <
                DateTime.fromFormat(
                  selectedPeriode[0].start_date,
                  "yyyy-MM-dd"
                ) &&
              item[objNamePaid] &&
              item[objNameOrderID] !== ""
            ) {
              setSummary((prev) => ({
                ...prev,
                prevCount: prev.prevCount + 1,
                prevPrice: prev.prevPrice + item.honor_perpertemuan,
              }));
            } else if (
              DateTime.fromFormat(item[objDate], "dd/MM/yyyy") >=
                DateTime.fromFormat(
                  selectedPeriode[0].start_date,
                  "yyyy-MM-dd"
                ) &&
              DateTime.fromFormat(item[objDate], "dd/MM/yyyy") <=
                DateTime.fromFormat(
                  selectedPeriode[0].end_date,
                  "yyyy-MM-dd"
                ).plus({ days: -1 }) &&
              item[objNameOrderID] !== ""
            ) {
              if (item[objNamePaid]) {
                setSummary((prev) => ({
                  ...prev,
                  currCountPaid: prev.currCountPaid + 1,
                  currPricePaid: prev.currPricePaid + item.honor_perpertemuan,
                }));
              } else {
                unpaidOrderId.push(item[objNameOrderID]);
                setSummary((prev) => ({
                  ...prev,
                  currCountUnpaid: prev.currCountUnpaid + 1,
                  currPriceUnpaid:
                    prev.currPriceUnpaid + item.honor_perpertemuan,
                }));
              }
            } else if (
              DateTime.fromFormat(item[objDate], "dd/MM/yyyy") >
                DateTime.fromFormat(
                  selectedPeriode[0].end_date,
                  "yyyy-MM-dd"
                ).plus({ days: -1 }) &&
              !item[objNamePaid] &&
              item[objNameOrderID] !== ""
            ) {
              setSummary((prev) => ({
                ...prev,
                nextCount: prev.nextCount + 1,
                nextPrice: prev.nextPrice + item.honor_perpertemuan,
              }));
            }
          }
        }
      });

      setUnpaidList(unpaidOrderId);
    } catch (error) {
      console.error("Error fetching rekap data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reSummarize();
  }, [listData]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!editModalVisible && isEdited) {
      fetchRekapData();
    }
  }, [editModalVisible]);

  const onSubmit = (formData) => {
    fetchRekapData();
  };

  const handleDetail = (e) => {
    setDetailModalVisible(true); // Open the modal
    setModalData(e); // Pass data to the modal
  };

  const handleEdit = async (e) => {
    await getOrderById(e.order_id).then((res) => {
      setEditModalVisible(true); // Open the modal
      setModalData(res.data.results); // Pass data to the modal
    });
  };

  const updatedListData = (newData) => {
    setListData((prevListData) => {
      if (!Array.isArray(prevListData.results)) {
        console.error("results is not an array");
        return prevListData;
      }

      const updatedResults = prevListData.results.map((order) => {
        const updatedOrder = { ...order };
        for (let i = 1; i <= 8; i++) {
          const detailKey = `p${i}_order_detail_id`;
          const paidKey = `p${i}_paid`;
          if (order[detailKey] === newData.order_detail_id) {
            updatedOrder[paidKey] = true;
            break; // Exit loop once a match is found
          }
        }
        return updatedOrder;
      });

      return { ...prevListData, results: updatedResults };
    });
  };

  const COLUMNS = [
    // {
    //   Header: "Order ID",
    //   accessor: "order_id",
    //   Cell: ({ cell }) => <span>{cell?.value}</span>,
    // },
    {
      Header: "Siswa",
      accessor: "student_fullname",
      sticky: "left",
      Cell: ({ cell }) => <span>{cell?.value}</span>,
    },
    {
      Header: "Produk",
      accessor: "product",
      Cell: ({ cell }) => <span>{cell?.value}</span>,
    },
    {
      Header: "Tanggal Order",
      accessor: "tgl_transaksi",
      // Cell: ({ cell }) => <span>{cell?.value}</span>,
      Cell: ({ cell }) => (
        <span>{DateTime.fromISO(cell?.value).toFormat("d MMMM yyyy")}</span>
      ),
    },
    // {
    //   Header: "Tanggal Kadaluwarsa",
    //   accessor: "tgl_habis",
    //   // Cell: ({ cell }) => <span>{cell?.value}</span>,
    //   Cell: ({ cell }) => (
    //     <span>
    //       {cell?.value
    //         ? DateTime.fromISO(cell?.value).toFormat("d MMMM yyyy")
    //         : ""}
    //     </span>
    //   ),
    // },
    {
      Header: "Total Honor",
      accessor: "total_honor_perpertemuan",
      Cell: ({ cell }) => <span>{cell?.value.toLocaleString()}</span>,
    },
    {
      Header: "p1",
      accessor: "p1_paid",
      Cell: ({ row }) => {
        const p = row.original.p1;
        const paid = row.original.p1_paid;
        const order_detail_id = row.original.p1_order_detail_id;

        return (
          <CellDetail
            tanggal={p}
            status={paid}
            order_detail_id={order_detail_id}
          />
        );
      },
    },
    {
      Header: "p2",
      accessor: "p2",
      Cell: ({ row }) => {
        const p = row.original.p2;
        const paid = row.original.p2_paid;
        const order_detail_id = row.original.p2_order_detail_id;

        return (
          <CellDetail
            tanggal={p}
            status={paid}
            order_detail_id={order_detail_id}
          />
        );
      },
    },
    {
      Header: "p3",
      accessor: "p3",
      Cell: ({ row }) => {
        const p = row.original.p3;
        const paid = row.original.p3_paid;
        const order_detail_id = row.original.p3_order_detail_id;

        return (
          <CellDetail
            tanggal={p}
            status={paid}
            order_detail_id={order_detail_id}
          />
        );
      },
    },
    {
      Header: "p4",
      accessor: "p4",
      Cell: ({ row }) => {
        const p = row.original.p4;
        const paid = row.original.p4_paid;
        const order_detail_id = row.original.p4_order_detail_id;

        return (
          <CellDetail
            tanggal={p}
            status={paid}
            order_detail_id={order_detail_id}
          />
        );
      },
    },
    {
      Header: "p5",
      accessor: "p5",
      Cell: ({ row }) => {
        const p = row.original.p5;
        const paid = row.original.p5_paid;
        const order_detail_id = row.original.p5_order_detail_id;

        return (
          <CellDetail
            tanggal={p}
            status={paid}
            order_detail_id={order_detail_id}
          />
        );
      },
    },
    {
      Header: "p6",
      accessor: "p6",
      Cell: ({ row }) => {
        const p = row.original.p6;
        const paid = row.original.p6_paid;
        const order_detail_id = row.original.p6_order_detail_id;

        return (
          <CellDetail
            tanggal={p}
            status={paid}
            order_detail_id={order_detail_id}
          />
        );
      },
    },
    {
      Header: "p7",
      accessor: "p7",
      Cell: ({ row }) => {
        const p = row.original.p7;
        const paid = row.original.p7_paid;
        const order_detail_id = row.original.p7_order_detail_id;

        return (
          <CellDetail
            tanggal={p}
            status={paid}
            order_detail_id={order_detail_id}
          />
        );
      },
    },
    {
      Header: "p8",
      accessor: "p8",
      Cell: ({ row }) => {
        const p = row.original.p8;
        const paid = row.original.p8_paid;
        const order_detail_id = row.original.p8_order_detail_id;

        return (
          <CellDetail
            tanggal={p}
            status={paid}
            order_detail_id={order_detail_id}
          />
        );
      },
    },

    {
      Header: "Action",
      accessor: "action",
      id: "action",
      sticky: "right",
      Cell: (row) => (
        <div className="flex space-x-2 justify-center items-center">
          {actions.map((action, index) => (
            <TableAction key={index} action={action} row={row} />
          ))}
        </div>
      ),
    },
  ];

  const CellDetail = ({ tanggal, status, order_detail_id }) => {
    let bgColor = "";

    let periode = "next";
    if (
      DateTime.fromFormat(tanggal, "dd/MM/yyyy") <
      DateTime.fromFormat(selectedPeriode[0].start_date, "yyyy-MM-dd")
    )
      periode = "prev";
    else if (
      DateTime.fromFormat(tanggal, "dd/MM/yyyy") <=
        DateTime.fromFormat(selectedPeriode[0].end_date, "yyyy-MM-dd").plus({
          days: -1,
        }) &&
      DateTime.fromFormat(tanggal, "dd/MM/yyyy") >=
        DateTime.fromFormat(selectedPeriode[0].start_date, "yyyy-MM-dd")
    )
      periode = "curr";
    else if (
      DateTime.fromFormat(tanggal, "dd/MM/yyyy") >
      DateTime.fromFormat(selectedPeriode[0].end_date, "yyyy-MM-dd").plus({
        days: -1,
      })
    )
      periode = "next";
    else periode = "";

    let currentPeriode =
      DateTime.fromFormat(tanggal, "dd/MM/yyyy") <=
      DateTime.fromFormat(selectedPeriode[0].end_date, "yyyy-MM-dd").plus({
        days: -1,
      })
        ? true
        : false;

    // let prevPeriode =
    //   DateTime.fromFormat(tanggal, "dd/MM/yyyy") <=
    //   DateTime.fromFormat(selectedPeriode[0].start_date, "yyyy-MM-dd")
    //     ? true
    //     : false;

    if (tanggal && status === false) {
      bgColor = currentPeriode ? "bg-red-500" : "bg-yellow-400"; // Blue if p1 has value and p1_paid is false
    }

    return (
      <div className="flex flex-col items-center">
        <span>
          {tanggal
            ? status === true
              ? (() => {
                  switch (periode) {
                    case "curr":
                      return <PaidSign />;
                    case "prev":
                      return <PrevPaidSign />;
                    default:
                      return null;
                  }
                })()
              : (() => {
                  switch (periode) {
                    case "curr":
                      bgColor = "bg-red-500";
                      return (
                        <WillPaid
                          order_detail_id={order_detail_id}
                          current_periode={true}
                        />
                      );
                    case "prev":
                      bgColor = "bg-blue-500";
                      return (
                        <WillPaid
                          order_detail_id={order_detail_id}
                          current_periode={false}
                        />
                      );
                    case "next":
                      return <NextMonth />;
                    default:
                      return null;
                  }
                })()
            : null}
        </span>
        <span className={`px-2 py-1 rounded  ${bgColor} text-black-500`}>
          {tanggal
            ? DateTime.fromFormat(tanggal, "dd/MM/yyyy").toFormat("dd/M")
            : ""}
        </span>
      </div>
    );
  };

  const WillPaid = ({ order_detail_id, current_periode }) => {
    return (
      <Tooltip
        placement="top"
        arrow
        content={current_periode ? "Belum dibayar" : "Telat Rekap"}
      >
        <div
          className={`w-full border-b border-b-gray-500 border-opacity-10 py-2 text-sm last:mb-0 cursor-pointer 
            first:rounded-t last:rounded-b flex space-x-2 items-center rtl:space-x-reverse
          `}
          // key={p1_order_detail_id}
        >
          <Icon
            icon="heroicons-outline:banknotes"
            color="green"
            className={`h-6 w-6`}
            onClick={() => handleBayarPerPertemuan(order_detail_id)}
          />
        </div>
      </Tooltip>
    );
  };

  const PaidSign = () => {
    return (
      <Tooltip placement="top" arrow content={"Dibayar periode sekarang"}>
        <div
          className={`w-full border-b border-b-gray-500 border-opacity-10 py-2 text-sm last:mb-0 cursor-pointer 
            first:rounded-t last:rounded-b flex space-x-2 items-center rtl:space-x-reverse
          `}
          // key={p1_order_detail_id}
        >
          <span className="text-base">
            <Icon
              icon="heroicons-outline:check-badge"
              color="blue"
              className={`h-6 w-6`}
            />
          </span>
        </div>
      </Tooltip>
    );
  };

  const PrevPaidSign = () => {
    return (
      <Tooltip placement="top" arrow content={"Dibayar periode sebelumnya"}>
        <div
          className={`w-full border-b border-b-gray-500 border-opacity-10 py-2 text-sm last:mb-0 cursor-pointer 
            first:rounded-t last:rounded-b flex space-x-2 items-center rtl:space-x-reverse
          `}
          // key={p1_order_detail_id}
        >
          <span className="text-base">
            <Icon
              icon="heroicons-outline:x-mark"
              color="red"
              className={`h-4 w-4`}
            />
          </span>
        </div>
      </Tooltip>
    );
  };

  const NextMonth = () => {
    return (
      <Tooltip placement="top" arrow content={"Rekapan Bulan Depan"}>
        <div
          className={`w-full border-b border-b-gray-500 border-opacity-10 py-2 text-sm last:mb-0 cursor-pointer 
            first:rounded-t last:rounded-b flex space-x-2 items-center rtl:space-x-reverse
          `}
          // key={p1_order_detail_id}
        >
          <span className="text-base">
            <Icon
              icon="heroicons-outline:exclamation-circle"
              color="black"
              className={`h-6 w-6 `}
            />
          </span>
        </div>
      </Tooltip>
    );
  };

  const PeriodSummary = () => {
    return (
      <div className="flex flex-row flex-nowrap overflow-x-auto gap-4 my-10">
        {/* Previous */}
        <div className="flex flex-col gap-2 border border-black-500 rounded px-4 py-4 bg-white">
          <p className="flex justify-center gap-3">
            <span className="text-base">
              <Icon
                icon="heroicons-outline:check-badge"
                color="blue"
                className={`h-6 w-6`}
              />
            </span>
            <span className="font-bold">Periode Sebelumnya</span>
          </p>
          <p>
            <span>Pertemuan : {summary.prevCount}</span>
            <br />
            <span>Honor : Rp. {summary.prevPrice.toLocaleString()}</span>
          </p>
        </div>
        {/* Current Paid */}
        <div className="flex flex-col gap-2 border border-black-500 rounded px-4 py-4 bg-green-300">
          <p className="flex justify-center gap-3">
            <span className="text-base">
              <Icon
                icon="heroicons-outline:banknotes"
                color="Green"
                className={`h-6 w-6`}
              />
            </span>
            <span className="font-bold">
              Periode Sekarang <b>(Paid)</b>
            </span>
          </p>
          <p>
            <span>Pertemuan : {summary.currCountPaid}</span>
            <br />
            <span>Honor : Rp. {summary.currPricePaid.toLocaleString()}</span>
          </p>
        </div>
        {/* Current Unpaid */}
        <div className="flex flex-col gap-2 border border-black-500 rounded px-4 py-4 bg-red-300">
          <p className="flex justify-center gap-3">
            <span className="text-base">
              <Icon
                icon="heroicons-outline:banknotes"
                color="Green"
                className={`h-6 w-6`}
              />
            </span>
            <span className="font-bold">
              Periode Sekarang <b>(Unpaid)</b>
            </span>
          </p>
          <p>
            <span>Pertemuan : {summary.currCountUnpaid}</span>
            <br />
            <span>Honor : Rp. {summary.currPriceUnpaid.toLocaleString()}</span>
          </p>
        </div>
        {/* Next */}
        <div className="flex flex-col gap-2 border border-black-500 rounded px-4 py-4 bg-yellow-300">
          <p className="flex justify-center gap-3">
            <span className="text-base">
              <Icon
                icon="heroicons-outline:exclamation-circle"
                color="black"
                className={`h-6 w-6`}
              />
            </span>
            <span className="font-bold">Periode Selanjutnya</span>
          </p>
          <p>
            <span>Pertemuan : {summary.nextCount}</span>
            <br />
            <span>Honor : Rp. {summary.nextPrice.toLocaleString()}</span>
          </p>
        </div>
      </div>
    );
  };

  const handlePayAll = async (params) => {
    if (params.length > 0) {
      // params.forEach(async (order_detail_id) => {
      //   let newParams = checkIfGroupPayment(params);
      const response = await BayarPelatihByTrainer(params);
      if (response.status === 200) {
        setListData((prev) => ({
          ...prev,
          results: prev.results.map((item) => {
            const updatedItem = { ...item };
            Object.keys(updatedItem).forEach((key) => {
              if (key.startsWith("p") && key.endsWith("_order_detail_id")) {
                const paidKey = key.replace("_order_detail_id", "_paid");
                if (params.includes(updatedItem[key])) {
                  updatedItem[paidKey] = true;
                }
              }
            });
            return updatedItem;
          }),
        }));
      }
      // });
    }
  };

  function findOrderByDetailId(orders, orderDetailId) {
    let order = orders.find(
      (order) =>
        String(order.order_id) && Object.values(order).includes(orderDetailId)
    );
    if (!order) return null;

    let matchedKey = Object.keys(order).find(
      (key) =>
        order[key] === orderDetailId &&
        key.startsWith("p") &&
        key.endsWith("_order_detail_id")
    );

    return matchedKey
      ? { order_id: order.order_id, matched_key: matchedKey }
      : null;
  }

  const checkIfGroupPayment = (data) => {
    let addOrderDetailID = [];

    data.forEach((orderDetailId) => {
      const result = findOrderByDetailId(listData.results, orderDetailId);

      if (result) {
        listData.results.forEach((item) => {
          if (item.order_id === result.order_id) {
            if (result.matched_key in item) {
              addOrderDetailID.push(item[result.matched_key]);
            }
          }
        });
      }
    });
    return addOrderDetailID.concat(data);
  };

  const handleBayarPerPertemuan = (order_detail_id) => {
    handlePayAll([order_detail_id]);
  };

  const handleBayarPerOrder = (e) => {
    try {
      // setUnpaidList([]);
      // let x = listPeriode.filter((a) => a.name === selectedPeriode);
      // let data = e;
      console.log(e.order_id);
      // console.log(listData.results.filter((x) => (x.order_id = e.order_id)));
      let filteredData = listData.results.filter(
        (x) => x.order_id === e.order_id
      );

      let unpaidOrderId = [];
      filteredData.forEach((element) => {
        for (let index = 1; index <= 8; index++) {
          var objDate = "p" + index;
          var objNamePaid = "p" + index + "_paid";
          var objNameOrderID = "p" + index + "_order_detail_id";

          if (
            !element[objNamePaid] &&
            element[objNameOrderID] !== "" &&
            element[objDate] !== "" &&
            DateTime.fromFormat(element[objDate], "dd/MM/yyyy") <=
              DateTime.fromFormat(
                selectedPeriode[0].end_date,
                "yyyy-MM-dd"
              ).plus({ days: -1 }) &&
            DateTime.fromFormat(element[objDate], "dd/MM/yyyy") >=
              DateTime.fromFormat(selectedPeriode[0].start_date, "yyyy-MM-dd")
          ) {
            unpaidOrderId.push(element[objNameOrderID]);
          }
        }
      });

      // setUnpaidList(unpaidOrderId);
      handlePayAll(unpaidOrderId);
      // alert(JSON.stringify(unpaidOrderId));
      console.log(unpaidOrderId);
    } catch (error) {
      console.log(error);
    }
  };

  const handleBayarSemua = () => {
    try {
      // setUnpaidList([]);
      // let x = listPeriode.filter((a) => a.name === selectedPeriode);
      // let data = e;

      let unpaidOrderId = [];
      listData.results.map((item) => {
        for (let index = 1; index <= 8; index++) {
          var objDate = "p" + index;
          var objNamePaid = "p" + index + "_paid";
          var objNameOrderID = "p" + index + "_order_detail_id";

          if (
            !item[objNamePaid] &&
            item[objNameOrderID] !== "" &&
            item[objDate] !== "" &&
            DateTime.fromFormat(item[objDate], "dd/MM/yyyy") <=
              DateTime.fromFormat(
                selectedPeriode[0].end_date,
                "yyyy-MM-dd"
              ).plus({ days: -1 }) &&
            DateTime.fromFormat(item[objDate], "dd/MM/yyyy") >=
              DateTime.fromFormat(selectedPeriode[0].start_date, "yyyy-MM-dd")
          ) {
            unpaidOrderId.push(item[objNameOrderID]);
          }
        }
      });
      // console.log(unpaidOrderId);
      // setUnpaidList(unpaidOrderId);
      handlePayAll(unpaidOrderId.sort());
      // alert(JSON.stringify(unpaidOrderId));
    } catch (error) {
      console.log(error);
    }
  };

  const downloadExcelFile = async () => {
    try {
      setIsDownload(true);
      let response = await ExportRekapBulanan(selectedPeriode[0].name);
      // Create a Blob from the response
      const blob = new Blob([response], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    } catch (error) {
      console.error("Error downloading the file:", error);
    } finally {
      setIsDownload(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 justify-end">
        <Card title="Rekap Bulanan">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="md:grid grid-cols-4 gap-4 items-end auto-cols-min"
          >
            <Select
              name="trainer"
              label="Coach"
              placeholder="Pilih Coach"
              register={register}
              error={errors.trainer?.message}
              options={listTrainer
                .map((item) => ({
                  value: item.trainer_id,
                  label: item.nickname,
                }))
                .sort((a, b) => a.label.localeCompare(b.label))}
              // defaultValue={listTrainer[0]?.value || ""}
              onChange={(e) =>
                setSelectedTrainer(
                  listTrainer.filter((a) => a.trainer_id === e.target.value)
                )
              }
            />
            <Select
              name="periode"
              label="Periode"
              placeholder="Pilih Periode"
              register={register}
              error={errors.periode?.message}
              options={listPeriode
                .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
                .map((item) => ({
                  value: item.name,
                  label: item.name,
                }))}
              // defaultValue={listPeriode[0]?.value || ""}
              onChange={(e) =>
                setSelectedPeriode(
                  listPeriode.filter((a) => a.name === e.target.value)
                )
              }
            />
            <div className="flex gap-2 mb:py-5 pl-4 gap-3 items-center">
              <button
                type="submit"
                className="btn btn-dark text-center h-9 py-1 w-max"
              >
                <span>Filter</span>
              </button>
              {isDownload ? (
                <div className="flex flex-row justify-center gap-2">
                  <span>Downloading</span>
                  <div className="w-5 h-5 border-4 border-t-blue-500 border-gray-300 rounded-full animate-spin"></div>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-success text-center h-9 py-1 px-5 w-max "
                  onClick={() => downloadExcelFile()}
                  disabled={isDownload}
                >
                  <div className="flex flex-row align-center gap-1">
                    <Icon
                      icon="heroicons-outline:arrow-down-on-square-stack"
                      color="Green"
                      className={`h-6 w-6`}
                    />
                    <span>Export Periode</span>
                  </div>
                </button>
              )}
            </div>
            {listData.results.length > 0 ? (
              <div className="flex flex-row-reverse content-end pt-3 flex-1">
                <button
                  type="button"
                  className="btn text-center border border-black-500 rounded p-4"
                  onClick={() => handleBayarSemua()}
                >
                  <div className="flex flex-row gap-3 items-center">
                    <Icon
                      icon="heroicons-outline:banknotes"
                      color="green"
                      className={`h-6 w-6`}
                    />
                    <div className="flex flex-col">
                      <span>Bayar semua</span>
                      <span>
                        {unpaidList.length > 1 ? (
                          <span>Rp. {summary.currPriceUnpaid}</span>
                        ) : (
                          "Sudah Dibayar"
                        )}
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            ) : null}
          </form>
          {isLoading ? (
            <SkeletionTable />
          ) : listData.results.length > 0 ? (
            <>
              <PeriodSummary />
              <Table listData={listData} listColumn={COLUMNS} />
            </>
          ) : (
            <p>No data available</p>
          )}
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
                fromRekap={true}
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
              />
            </Modal>
          )}
        </Card>
      </div>
    </>
  );
};

export default RekapBulanan;
