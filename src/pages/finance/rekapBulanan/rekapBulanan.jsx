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
import { getRekapByTrainer } from "@/axios/rekap/bulanan";
import Swal from "sweetalert2";
import { DeleteOrder } from "@/axios/masterdata/order";
import SkeletionTable from "@/components/skeleton/Table";
import { Icon } from "@iconify/react";
import Tooltip from "@/components/ui/Tooltip";
import Button from "@/components/ui/Button";

const RekapBulanan = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [listTrainer, setListTrainer] = useState([]);
  const [listPeriode, setListPeriode] = useState([]);
  const [listData, setListData] = useState({ results: [] });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrainer, setSelectedTrainer] = useState("");
  const [selectedPeriode, setSelectedPeriode] = useState("");
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

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
      name: "Detail",
      icon: "heroicons-outline:eye",
      onClick: (row) => handleDetail(row.row.original),
      // navigate("detailorderpelatih", { state: { data: row.row.original } }),
      className:
        "bg-success-500 text-success-500 bg-opacity-30 hover:bg-opacity-100 hover:",
    },
    // {
    //   name: "delete",
    //   icon: "heroicons-outline:trash",
    //   onClick: (row) => handleDelete(row.row.original),
    //   className:
    //     "bg-danger-500 text-danger-500 bg-opacity-30 hover:bg-opacity-100 hover:text-white",
    // },
  ];

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const trainerParams = { page: 1, page_size: 100, search: searchQuery };

      const trainerResponse = await getTrainerAll(trainerParams);
      const trainerOptions = trainerResponse.data.results
        .map((item) => ({
          value: item.trainer_id,
          label: item.fullname,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
      setListTrainer(trainerOptions);

      const periodeResponse = await getPeriodisasiAll(trainerParams);
      const periodeOptions = periodeResponse.data.results
        .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
        .map((item) => ({
          value: item.name,
          label: item.name,
        }));
      setListPeriode(periodeOptions);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRekapData = async (trainer, periode) => {
    try {
      setIsLoading(true);

      const response = await getRekapByTrainer(periode, trainer);
      setListData(response.data);
    } catch (error) {
      console.error("Error fetching rekap data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = (formData) => {
    setSelectedTrainer(formData.trainer);
    setSelectedPeriode(formData.periode);
    fetchRekapData(formData.trainer, formData.periode);
  };

  const handleDetail = (e) => {
    setDetailModalVisible(true); // Open the modal
    setModalData(e); // Pass data to the modal
  };

  const updatedListData = (newData) => {
    let data = [...listData.results];
    // console.log(newData);

    // let temp = {
    //   ...listData,
    //   results: data.map((item) => ({
    //     ...item,
    //     detail: item.detail.map((itemdetail) => ({
    //       ...itemdetail,
    //       is_presence:
    //         itemdetail.order_detail_id === newData.order_detail_id
    //           ? newData.is_presence
    //           : itemdetail.is_presence,
    //       is_paid:
    //         itemdetail.order_detail_id === newData.order_detail_id
    //           ? newData.is_paid
    //           : itemdetail.is_paid,
    //     })),
    //   })),
    // };
    // setListData(temp);
  };

  const COLUMNS = [
    {
      Header: "Order ID",
      accessor: "order_id",
      Cell: ({ cell }) => <span>{cell?.value}</span>,
    },
    {
      Header: "Siswa",
      accessor: "student_fullname",
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
      Cell: ({ cell }) => <span>{cell?.value}</span>,
    },
    {
      Header: "Tanggal Kadaluwarsa",
      accessor: "tgl_habis",
      Cell: ({ cell }) => <span>{cell?.value}</span>,
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
      Cell: (row) => (
        <div className="flex space-x-2 items-center">
          {actions.map((action, index) => (
            <TableAction key={index} action={action} row={row} />
          ))}
        </div>
      ),
    },
  ];

  const CellDetail = ({ tanggal, status, order_detail_id }) => {
    let bgColor = "";
    if (tanggal && status === false) {
      bgColor = "bg-red-500"; // Blue if p1 has value and p1_paid is false
    }

    return (
      <div className="flex flex-col items-center">
        <span>
          {tanggal ? (
            status === true ? (
              <PaidSign />
            ) : (
              <WillPaid order_detail_id={order_detail_id} />
            )
          ) : null}
        </span>
        <span className={`px-2 py-1 rounded  ${bgColor} text-black-500`}>
          {tanggal || ""}
        </span>
      </div>
    );
  };

  const WillPaid = ({ order_detail_id }) => {
    return (
      <Tooltip placement="top" arrow content={"Akan dibayar"}>
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
            onClick={() => alert()}
          />
        </div>
      </Tooltip>
    );
  };

  const PaidSign = () => {
    return (
      <Tooltip placement="top" arrow content={"Sudah dibayar"}>
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

  return (
    <>
      <div className="grid grid-cols-1 justify-end">
        <Card title="Rekap Bulanan">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-5">
            <Select
              name="trainer"
              label="Coach"
              placeholder="Pilih Coach"
              register={register}
              error={errors.trainer?.message}
              options={listTrainer}
              defaultValue={listTrainer[0]?.value || ""}
            />
            <Select
              name="periode"
              label="Periode"
              placeholder="Pilih Periode"
              register={register}
              error={errors.periode?.message}
              options={listPeriode}
              defaultValue={listPeriode[0]?.value || ""}
            />
            <div className="ltr:text-right rtl:text-left space-x-3">
              <button type="submit" className="btn btn-dark text-center">
                Filter
              </button>
            </div>
          </form>
          {isLoading ? (
            <SkeletionTable />
          ) : listData.results.length > 0 ? (
            <Table listData={listData} listColumn={COLUMNS} />
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
              />
            </Modal>
          )}
        </Card>
      </div>
    </>
  );
};

export default RekapBulanan;
