import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Table from "@/components/globals/table/table";
import { DeleteCabang, getCabangAll } from "@/axios/referensi/cabang";
import Loading from "@/components/Loading";
import Button from "@/components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Search from "@/components/globals/table/search";
import PaginationComponent from "@/components/globals/table/pagination";
import TableAction from "@/components/globals/table/tableAction";
import { getTrainerLeave } from "@/axios/cuti";
import { useSelector } from "react-redux";

const Leave = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [listData, setListData] = useState({ count: 0, results: [] });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const { user_id, user_name, roles } = useSelector((state) => state.auth.data);

  const fetchData = async (page, size, query) => {
    try {
      setIsLoading(true);
      const params = {
        page: page + 1,
        page_size: size,
        search: query,
      };
      getTrainerLeave(user_id, params)
        .then((res) => {
          setListData(res);
        })
        .finally(() => setIsLoading(false))
        .catch((error) => {
          console.log(error);
        });
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

  //   const handleDelete = (e) => {
  //     Swal.fire({
  //       title: "Are you sure?",
  //       text: "You won't be able to revert this!",
  //       icon: "warning",
  //       showCancelButton: true,
  //       confirmButtonColor: "#22c55e",
  //       cancelButtonColor: "#ef4444",
  //       confirmButtonText: "Yes, delete it!",
  //     }).then((result) => {
  //       if (result.isConfirmed) {
  //         DeleteCabang(e.branch_id).then((res) => {
  //           if (res.status) {
  //             Swal.fire("Deleted!", "Your file has been deleted.", "success");
  //             fetchData(pageIndex, pageSize, searchQuery);
  //           }
  //         });
  //       }
  //     });
  //   };

  //   const handleEdit = (e) => {
  //     navigate("edit", {
  //       state: {
  //         isupdate: "true",
  //         data: e,
  //       },
  //     });
  //   };

  const COLUMNS = [
    {
      Header: "Tanggal Mulai",
      accessor: "start_date",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Tanggal Selesai",
      accessor: "end_date",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Alasan Cuti",
      accessor: "reason",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Status Pengajuan",
      accessor: "status",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Disetujui Oleh",
      accessor: "approved_by",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Disetujui Tanggal",
      accessor: "approved_at",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    // {
    //   Header: "action",
    //   accessor: "action",
    //   id: "action",
    //   sticky: "right",
    //   Cell: (row) => {
    //     return (
    //       <div className="flex flex-row space-x-2 justify-center items-center">
    //         {actions.map((action, index) => (
    //           <TableAction action={action} index={index} row={row} />
    //         ))}
    //       </div>
    //     );
    //   },
    // },
  ];

  return (
    <div className="grid grid-cols-1 justify-end">
      <Card
        title="Pengajuan Cuti"
        headerslot={
          <Button className="btn-primary ">
            <Link to="ajukan" isupdate="false">
              Buat Ajuan
            </Link>
          </Button>
        }
      >
        {isLoading ? (
          <Loading />
        ) : (
          <>
            {/* <Search searchValue={searchQuery} handleSearch={handleSearch} /> */}
            <Table
              listData={listData}
              listColumn={COLUMNS}
              searchValue={searchQuery}
              handleSearch={handleSearch}
              isAction={false}
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

export default Leave;
