import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Loading from "@/components/Loading";
import Button from "@/components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import PaginationComponent from "@/components/globals/table/pagination";
import { getTrainerLeave } from "@/axios/cuti";
import { useSelector } from "react-redux";
import { DateTime } from "luxon";
import { toProperCase } from "@/utils";

const Leave = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [listData, setListData] = useState({ count: 0, results: [] });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const { user_id, user_name, roles } = useSelector((state) => state.auth.data);
  const [selectStatus, setSelectStatus] = useState("pending");
  const status = ["pending", "approved", "rejected"];

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
          setData(res.results);
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
            <div className="my-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Ajuan
              </label>
              <div className="grid grid-cols-2 gap-3 sm:flex sm:space-x-4 sm:space-y-0 space-y-3">
                {status.map((option) => {
                  // mapping warna berdasarkan status
                  const colorMap = {
                    approved: "green",
                    rejected: "red",
                    pending: "yellow",
                  };
                  const color = colorMap[option.toLowerCase()] || "blue";

                  return (
                    <label
                      key={option}
                      className={`flex items-center justify-center px-4 py-2 border rounded-lg cursor-pointer transition
            ${
              selectStatus === option
                ? `border-${color}-500 bg-${color}-50 text-${color}-700 font-semibold`
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={option}
                        checked={selectStatus === option}
                        onChange={(e) => {
                          setSelectStatus(e.target.value);
                          handleSearch(e.target.value);
                        }}
                        className="hidden"
                      />
                      {toProperCase(option)}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="w-full p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.map((item, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow p-4">
                    {/* Header Info */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                      <div className="text-sm">
                        <p className="text-gray-500">Tanggal Cuti</p>
                        <p className="font-medium">
                          {DateTime.fromISO(item.start_date)
                            .setLocale("id")
                            .toFormat("cccc, dd LLLL yyyy")}{" "}
                          sampai{" "}
                          {DateTime.fromISO(item.end_date)
                            .setLocale("id")
                            .toFormat("cccc, dd LLLL yyyy")}
                        </p>
                      </div>
                      <span
                        className={`self-start px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                          item.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : item.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="mb-6">
                      <p className="text-sm text-gray-500">Alasan</p>
                      <p className="font-medium">{item.reason}</p>
                    </div>

                    {/* Replacement Section */}
                    <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3">
                      Jadwal Pengganti
                    </h3>

                    <div className="space-y-4">
                      {item.replacements.map((rep, idx) => (
                        <div
                          key={idx}
                          className="p-4 border rounded-xl bg-gray-50 shadow-sm space-y-3"
                        >
                          {/* Students */}
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Siswa</p>
                            <div className="flex flex-wrap gap-2">
                              {rep.students && rep.students.length > 0 ? (
                                rep.students.map((s, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-1 bg-gray-200 rounded-full text-xs text-gray-700"
                                  >
                                    {s}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </div>
                          </div>

                          {/* Replacement Info */}
                          <div
                            className={`grid ${
                              rep.replacement_type === "reschedule"
                                ? "grid-cols-3 sm:grid-cols-3"
                                : "grid-cols-2 sm:grid-cols-2"
                            } gap-3 text-sm`}
                          >
                            <div>
                              <p className="text-xs text-gray-500">Tipe</p>
                              <p className="font-medium capitalize">
                                {rep.replacement_type}
                              </p>
                            </div>
                            {rep.replacement_type === "reschedule" ? (
                              <>
                                <div>
                                  <p className="text-xs text-gray-500">
                                    Tanggal Pengganti
                                  </p>
                                  <p className="font-medium">
                                    {DateTime.fromISO(rep.new_date)
                                      .setLocale("id")
                                      .toFormat("cccc, dd LLLL yyyy")}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">
                                    Jam Pengganti
                                  </p>
                                  <p className="font-medium">{rep.new_time}</p>
                                </div>{" "}
                              </>
                            ) : (
                              <>
                                <div>
                                  <p className="text-xs text-gray-500">
                                    Trainer Pengganti
                                  </p>
                                  <p className="font-medium">
                                    {rep.substitute_trainer_name ?? "-"}
                                  </p>
                                </div>
                              </>
                            )}

                            {/* <div>
                            <p className="text-xs text-gray-500">Jam Baru</p>
                            <p className="font-medium">{rep.new_time}</p>
                          </div> */}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <PaginationComponent
              pageSize={pageSize}
              pageIndex={pageIndex}
              pageCount={Math.ceil(listData.count / pageSize)}
              canPreviousPage={pageIndex > 0}
              canNextPage={
                pageIndex < Math.ceil(listData.results.count / pageSize) - 1
              }
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
