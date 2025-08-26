import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Loading from "@/components/Loading";
import Button from "@/components/ui/Button";
import { Link } from "react-router-dom";
import PaginationComponent from "@/components/globals/table/pagination";
import { approveTrainerLeave, getAllTrainerLeaves } from "@/axios/cuti";
import { useSelector } from "react-redux";
import { DateTime } from "luxon";
import { toProperCase } from "@/utils";
import { Icon } from "@iconify/react";

const Leave = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [listData, setListData] = useState({ count: 0, results: [] });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("pending");
  const { user_id, user_name, roles } = useSelector((state) => state.auth.data);
  const [selectStatus, setSelectStatus] = useState("pending");
  const status = ["pending", "approved", "rejected"];
  const [selectedFilter, setSelectedFilter] = useState("pending");

  const fetchData = async (page, size, query) => {
    try {
      setIsLoading(true);
      const params = {
        page: page + 1,
        page_size: size,
        search: query,
      };
      getAllTrainerLeaves(params)
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
    setSelectedFilter(query);
    setSearchQuery(query);
    setPageIndex(0); // Reset to first page on search
  };

  const handleApproval = (leave_id, isApproved = false) => {
    approveTrainerLeave(leave_id, {
      action: isApproved ? "approve" : "reject",
    });
  };

  const groupedData = data.reduce((acc, item) => {
    if (!acc[item.start_date]) {
      acc[item.start_date] = {};
    }

    if (!acc[item.start_date][item.trainer_name]) {
      acc[item.start_date][item.trainer_name] = [];
    }

    acc[item.start_date][item.trainer_name].push(item);

    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 justify-end">
      <Card
        title="Pengajuan Izin Pelatih"
        headerslot={
          <div className="flex flex-row items-center my-4 gap-3">
            <span className="block text-sm font-medium text-gray-700">
              Status Ajuan :
            </span>
            <div className="grid grid-cols-2 sm:flex sm:space-x-4 sm:space-y-0 space-y-3">
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
        }
      >
        {isLoading ? (
          <Loading />
        ) : (
          <>
            {/* daftar ajuan */}

            <div className="w-full p-4">
              <div className="space-y-10">
                {Object.entries(groupedData).map(([startDate, trainers], i) => (
                  <div key={i} className="space-y-6">
                    {/* Header Tanggal */}
                    <h2 className="text-xl font-bold text-gray-800 border-b pb-2">
                      {DateTime.fromISO(startDate)
                        .setLocale("id")
                        .toFormat("cccc, dd LLLL yyyy")}
                    </h2>

                    {Object.entries(trainers).map(
                      ([trainerName, leaves], idx) => (
                        <div
                          key={idx}
                          className="bg-white rounded-2xl shadow p-5 space-y-6"
                        >
                          {/* Header Pelatih */}
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b pb-3 gap-2">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-800">
                                {trainerName}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {leaves.length} pengajuan izin
                              </p>
                            </div>
                          </div>

                          {/* Grid Izin */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {leaves.map((item, i) => (
                              <div
                                key={i}
                                className="bg-gray-50 rounded-xl p-4 flex flex-col justify-between"
                              >
                                {/* Header Info */}
                                <div className="flex justify-between items-start mb-4">
                                  <div className="text-sm">
                                    <p className="text-gray-500">
                                      Tanggal Izin
                                    </p>
                                    <p className="font-medium">
                                      {DateTime.fromISO(item.start_date)
                                        .setLocale("id")
                                        .toFormat("cccc, dd LLLL yyyy")}{" "}
                                      s/d{" "}
                                      {DateTime.fromISO(item.end_date)
                                        .setLocale("id")
                                        .toFormat("cccc, dd LLLL yyyy")}
                                    </p>
                                  </div>
                                  {selectedFilter === "pending" && (
                                    <div className="flex flex-col gap-3">
                                      <Button
                                        icon="heroicons-outline:check"
                                        text="Accept"
                                        className="btn-success  rounded-[999px] p-2"
                                        onClick={() => {
                                          handleApproval(item.leave_id, true);
                                        }}
                                      />
                                      <Button
                                        icon="heroicons-outline:x-mark"
                                        text="Reject"
                                        className="btn-danger  rounded-[999px] p-2"
                                        onClick={() => {
                                          handleApproval(item.leave_id, false);
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Reason */}
                                <div className="mb-4 border border-yellow-300 rounded-2xl p-2 flex items-start gap-2">
                                  {/* Icon di kiri */}
                                  <Icon
                                    icon="heroicons-outline:information-circle"
                                    className="w-5 h-5 text-yellow-500 mt-0.5"
                                  />

                                  {/* Teks di kanan */}
                                  <div>
                                    <p className="text-xs text-gray-500">
                                      Info Admin :
                                    </p>
                                    <p className="text-sm font-medium">
                                      {item.objections[0]?.reason}
                                    </p>
                                  </div>
                                </div>

                                {/* Reason */}
                                <div className="mb-4">
                                  <p className="text-xs text-gray-500">
                                    Alasan :
                                  </p>
                                  <p className="text-sm font-medium">
                                    {item.reason}
                                  </p>
                                </div>

                                {/* Replacement Section */}
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                    Jadwal Pengganti
                                  </h4>

                                  <div className="space-y-3">
                                    {item.replacements.map((rep, idx2) => (
                                      <div
                                        key={idx2}
                                        className="p-3 border rounded-lg bg-white space-y-3"
                                      >
                                        {/* Students */}
                                        <div>
                                          <p className="text-xs text-gray-500 mb-1">
                                            Siswa
                                          </p>
                                          <div className="flex flex-wrap gap-2">
                                            {rep.students?.length > 0 ? (
                                              rep.students.map((s, i) => (
                                                <span
                                                  key={i}
                                                  className="px-2 py-1 bg-gray-200 rounded-full text-xs text-gray-700"
                                                >
                                                  {s}
                                                </span>
                                              ))
                                            ) : (
                                              <span className="text-xs text-gray-400">
                                                -
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        {/* Replacement Info */}
                                        <div
                                          className={`grid gap-3 text-xs sm:text-sm ${
                                            rep.replacement_type ===
                                            "reschedule"
                                              ? "grid-cols-2"
                                              : "grid-cols-1"
                                          }`}
                                        >
                                          <div>
                                            <p className="text-gray-500">
                                              Tipe
                                            </p>
                                            <p className="font-medium capitalize">
                                              {rep.replacement_type}
                                            </p>
                                          </div>

                                          {rep.replacement_type ===
                                          "reschedule" ? (
                                            <>
                                              <div>
                                                <p className="text-gray-500">
                                                  Tanggal Pengganti
                                                </p>
                                                <p className="font-medium">
                                                  {DateTime.fromISO(
                                                    rep.new_date
                                                  )
                                                    .setLocale("id")
                                                    .toFormat(
                                                      "cccc, dd LLLL yyyy"
                                                    )}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-gray-500">
                                                  Jam Pengganti
                                                </p>
                                                <p className="font-medium">
                                                  {rep.new_time}
                                                </p>
                                              </div>
                                            </>
                                          ) : (
                                            <div>
                                              <p className="text-gray-500">
                                                Trainer Pengganti
                                              </p>
                                              <p className="font-medium">
                                                {rep.substitute_trainer_name ??
                                                  "-"}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}
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
