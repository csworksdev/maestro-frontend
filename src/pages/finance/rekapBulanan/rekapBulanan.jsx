import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Table from "@/components/globals/table/table";
import Loading from "@/components/Loading";
import { useNavigate } from "react-router-dom";
import { getTrainerAll } from "@/axios/masterdata/trainer";
import Search from "@/components/globals/table/search";
import PaginationComponent from "@/components/globals/table/pagination";
import TableAction from "@/components/globals/table/tableAction";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { getPeriodisasiAll } from "@/axios/referensi/periodisasi";
import Select from "@/components/ui/Select";
import { getRekapByTrainer } from "@/axios/rekap/bulanan";

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
      name: "Rekap",
      icon: "heroicons-outline:eye",
      onClick: (row) =>
        navigate("detailorderpelatih", { state: { data: row.row.original } }),
      className:
        "bg-success-500 text-success-500 bg-opacity-30 hover:bg-opacity-100 hover:text-white",
    },
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
        .sort((a, b) => a.value.localeCompare(b.value));
      setListTrainer(trainerOptions);

      const periodeResponse = await getPeriodisasiAll(trainerParams);
      const periodeOptions = periodeResponse.data.results.map((item) => ({
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

      const response = await getRekapByTrainer(periode, trainer).then((res) => {
        setListData(res.data);
      });
    } catch (error) {
      console.error("Error fetching rekap data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePageChange = (page) => setPageIndex(page);

  const handlePageSizeChange = (size) => setPageSize(size);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPageIndex(0);
    fetchData();
  };

  const onSubmit = (formData) => {
    setSelectedTrainer(formData.trainer);
    setSelectedPeriode(formData.periode);
    fetchRekapData(formData.trainer, formData.periode);
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
        const p1 = row.original.p1;
        const p1_paid = row.original.p1_paid;

        // Determine background color based on conditions
        let bgColor = "";
        if (p1 && p1_paid === true) {
          bgColor = ""; // Red if p1 has value and p1_paid is true
        } else if (p1 && p1_paid === false) {
          bgColor = "bg-red-500"; // Blue if p1 has value and p1_paid is false
        }

        return (
          <span
            className={`px-2 py-1 rounded text-white ${bgColor} text-black-500`}
          >
            {p1 || ""}
          </span>
        );
      },
    },
    {
      Header: "p2",
      accessor: "p2",
      Cell: ({ row }) => {
        const p2 = row.original.p2;
        const p2_paid = row.original.p2_paid;

        // Determine background color based on conditions
        let bgColor = "";
        if (p2 && p2_paid === true) {
          bgColor = ""; // Red if p2 has value and p2_paid is true
        } else if (p2 && p2_paid === false) {
          bgColor = "bg-red-500"; // Blue if p2 has value and p2_paid is false
        }

        return (
          <span
            className={`px-2 py-1 rounded text-white ${bgColor} text-black-500`}
          >
            {p2 || ""}
          </span>
        );
      },
    },
    {
      Header: "p3",
      accessor: "p3",
      Cell: ({ row }) => {
        const p3 = row.original.p3;
        const p3_paid = row.original.p3_paid;

        // Determine background color based on conditions
        let bgColor = "";
        if (p3 && p3_paid === true) {
          bgColor = ""; // Red if p3 has value and p3_paid is true
        } else if (p3 && p3_paid === false) {
          bgColor = "bg-red-500"; // Blue if p3 has value and p3_paid is false
        }

        return (
          <span
            className={`px-2 py-1 rounded text-white ${bgColor} text-black-500`}
          >
            {p3 || ""}
          </span>
        );
      },
    },
    {
      Header: "p4",
      accessor: "p4",
      Cell: ({ row }) => {
        const p4 = row.original.p4;
        const p4_paid = row.original.p4_paid;

        // Determine background color based on conditions
        let bgColor = "";
        if (p4 && p4_paid === true) {
          bgColor = ""; // Red if p4 has value and p4_paid is true
        } else if (p4 && p4_paid === false) {
          bgColor = "bg-red-500"; // Blue if p4 has value and p4_paid is false
        }

        return (
          <span
            className={`px-2 py-1 rounded text-white ${bgColor} text-black-500`}
          >
            {p4 || ""}
          </span>
        );
      },
    },
    {
      Header: "p5",
      accessor: "p5",
      Cell: ({ row }) => {
        const p5 = row.original.p5;
        const p5_paid = row.original.p5_paid;

        // Determine background color based on conditions
        let bgColor = "";
        if (p5 && p5_paid === true) {
          bgColor = ""; // Red if p5 has value and p5_paid is true
        } else if (p5 && p5_paid === false) {
          bgColor = "bg-red-500"; // Blue if p5 has value and p5_paid is false
        }

        return (
          <span
            className={`px-2 py-1 rounded text-white ${bgColor} text-black-500`}
          >
            {p5 || ""}
          </span>
        );
      },
    },
    {
      Header: "p6",
      accessor: "p6",
      Cell: ({ row }) => {
        const p6 = row.original.p6;
        const p6_paid = row.original.p6_paid;

        // Determine background color based on conditions
        let bgColor = "";
        if (p6 && p6_paid === true) {
          bgColor = ""; // Red if p6 has value and p6_paid is true
        } else if (p6 && p6_paid === false) {
          bgColor = "bg-red-500"; // Blue if p6 has value and p6_paid is false
        }

        return (
          <span
            className={`px-2 py-1 rounded text-white ${bgColor} text-black-500`}
          >
            {p6 || ""}
          </span>
        );
      },
    },
    {
      Header: "p7",
      accessor: "p7",
      Cell: ({ row }) => {
        const p7 = row.original.p7;
        const p7_paid = row.original.p7_paid;

        // Determine background color based on conditions
        let bgColor = "";
        if (p7 && p7_paid === true) {
          bgColor = ""; // Red if p7 has value and p7_paid is true
        } else if (p7 && p7_paid === false) {
          bgColor = "bg-red-500"; // Blue if p7 has value and p7_paid is false
        }

        return (
          <span
            className={`px-2 py-1 rounded text-white ${bgColor} text-black-500`}
          >
            {p7 || ""}
          </span>
        );
      },
    },
    {
      Header: "p8",
      accessor: "p8",
      Cell: ({ row }) => {
        const p8 = row.original.p8;
        const p8_paid = row.original.p8_paid;

        // Determine background color based on conditions
        let bgColor = "";
        if (p8 && p8_paid === true) {
          bgColor = ""; // Red if p8 has value and p8_paid is true
        } else if (p8 && p8_paid === false) {
          bgColor = "bg-red-500"; // Blue if p8 has value and p8_paid is false
        }

        return (
          <span
            className={`px-2 py-1 rounded text-white ${bgColor} text-black-500`}
          >
            {p8 || ""}
          </span>
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

  return (
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
        {listData.results.length > 0 ? (
          <Table listData={listData} listColumn={COLUMNS} />
        ) : (
          <p>No data available</p>
        )}
      </Card>
    </div>
  );
};

export default RekapBulanan;
