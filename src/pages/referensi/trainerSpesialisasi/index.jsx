import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Table from "@/components/globals/table/table";
import Loading from "@/components/Loading";
import Button from "@/components/ui/Button";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  DeleteTrainerSpecialization,
  getTrainerSpecialization,
} from "@/axios/referensi/trainerSpecialization";
import Search from "@/components/globals/table/search";
import PaginationComponent from "@/components/globals/table/pagination";
import TableAction from "@/components/globals/table/tableAction";

const Specialization = ({
  trainerId: propTrainerId,
  onAdd,
  onEdit,
  title = "Spesialisasi",
  refreshKey = 0,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const trainerId =
    propTrainerId ||
    location.state?.trainer_id ||
    location.state?.trainerId ||
    location.state?.data?.trainer_id;

  const [isLoading, setIsLoading] = useState(true);

  const [listData, setListData] = useState({ count: 0, results: [] });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const actions = [
    {
      name: "Edit",
      icon: "heroicons:pencil-square",
      onClick: (row) => handleEdit(row.row.original),
    },
    {
      name: "Delete",
      icon: "heroicons-outline:trash",
      onClick: (row) => handleDelete(row.row.original),
      className:
        "bg-danger-500 text-danger-500 bg-opacity-30 hover:bg-opacity-100 hover:text-white",
    },
  ];

  const fetchData = async (page, size, query) => {
    if (!trainerId) {
      setListData({ count: 0, results: [] });
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const params = {
        page: page + 1,
        page_size: size,
        search: query,
      };
      getTrainerSpecialization(trainerId, params)
        .then((res) => {
          const data = res?.data;
          if (Array.isArray(data)) {
            setListData({ count: data.length, results: data });
          } else if (data?.results) {
            setListData(data);
          } else {
            setListData({ count: 0, results: [] });
          }
        })
        .finally(() => setIsLoading(false));
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  useEffect(() => {
    fetchData(pageIndex, pageSize, searchQuery);
  }, [pageIndex, pageSize, searchQuery, trainerId, refreshKey]);

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
    if (!trainerId) {
      Swal.fire("Error", "Trainer tidak ditemukan.", "error");
      return;
    }
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
        DeleteTrainerSpecialization(trainerId).then((res) => {
          if (res.status) {
            Swal.fire("Deleted!", "Your file has been deleted.", "success");
            fetchData(pageIndex, pageSize, searchQuery);
          }
        });
      }
    });
  };

  const handleEdit = (e) => {
    const currentSpecializations = listData?.results || [];
    const payload = {
      isupdate: "true",
      data: e,
      trainer_id: trainerId,
      current_specializations: currentSpecializations,
    };
    if (onEdit) {
      onEdit(payload);
      return;
    }
    navigate("Edit", { state: payload });
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("id-ID");
  };

  const renderText = (value) => (value ? value : "-");

  const COLUMNS = [
    {
      Header: "Spesialisasi",
      accessor: "specialization_name",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Pengalaman (th)",
      accessor: "experience_years",
      Cell: (row) => <span>{row?.cell?.value ?? "-"}</span>,
    },
    {
      Header: "Sertifikasi",
      accessor: "certification",
      Cell: (row) => <span>{renderText(row?.cell?.value)}</span>,
    },
    {
      Header: "Link Sertifikasi",
      accessor: "certification_link",
      Cell: (row) => {
        const link = row?.cell?.value;
        if (!link) return <span>-</span>;
        return (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="text-primary-500 underline"
          >
            Lihat
          </a>
        );
      },
    },
    {
      Header: "Tgl Sertifikasi",
      accessor: "certification_date",
      Cell: (row) => <span>{formatDate(row?.cell?.value)}</span>,
    },
    {
      Header: "Tgl Kadaluarsa",
      accessor: "certification_expired_date",
      Cell: (row) => <span>{formatDate(row?.cell?.value)}</span>,
    },
    {
      Header: "Catatan",
      accessor: "notes",
      Cell: (row) => <span>{renderText(row?.cell?.value)}</span>,
    },
    {
      Header: "action",
      accessor: "action",
      id: "action",
      sticky: "right",
      Cell: (row) => {
        return (
          <div className="flex flex-wrap gap-2 justify-center items-center">
            {actions.map((action, index) => (
              <TableAction
                key={action.id || index} // 👈 kasih key DI SINI
                action={action}
                row={row}
              />
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 justify-end">
      <Card
        title={title}
        headerslot={
          <Button
            className="btn-primary "
            onClick={() => {
              const currentSpecializations = listData?.results || [];
              const payload = {
                isupdate: "false",
                trainer_id: trainerId,
                data: {},
                current_specializations: currentSpecializations,
              };
              if (onAdd) {
                onAdd(payload);
              } else {
                navigate("add", { state: payload });
              }
            }}
            disabled={!trainerId}
          >
            Tambah
          </Button>
        }
      >
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
      </Card>
    </div>
  );
};

export default Specialization;
