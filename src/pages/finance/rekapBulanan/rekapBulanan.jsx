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
      accessor: "p1",
      Cell: ({ cell }) => <span>{cell?.value}</span>,
    },
    {
      Header: "p2",
      accessor: "p2",
      Cell: ({ cell }) => <span>{cell?.value}</span>,
    },
    {
      Header: "p3",
      accessor: "p3",
      Cell: ({ cell }) => <span>{cell?.value}</span>,
    },
    {
      Header: "p4",
      accessor: "p4",
      Cell: ({ cell }) => <span>{cell?.value}</span>,
    },
    {
      Header: "p5",
      accessor: "p5",
      Cell: ({ cell }) => <span>{cell?.value}</span>,
    },
    {
      Header: "p6",
      accessor: "p6",
      Cell: ({ cell }) => <span>{cell?.value}</span>,
    },
    {
      Header: "p7",
      accessor: "p7",
      Cell: ({ cell }) => <span>{cell?.value}</span>,
    },
    {
      Header: "p8",
      accessor: "p8",
      Cell: ({ cell }) => <span>{cell?.value}</span>,
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
