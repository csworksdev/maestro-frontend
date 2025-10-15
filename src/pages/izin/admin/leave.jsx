import React, { useEffect, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import Loading from "@/components/Loading";
import Button from "@/components/ui/Button";
import { Link } from "react-router-dom";
import PaginationComponent from "@/components/globals/table/pagination";
import {
  approveTrainerLeave,
  getAllTrainerLeaves,
  submitObjection,
} from "@/axios/cuti";
import { useSelector } from "react-redux";
import { DateTime } from "luxon";
import { toProperCase } from "@/utils";
import { Icon } from "@iconify/react";
import { useForm } from "react-hook-form";
import Textinput from "@/components/ui/Textinput";
import { useLeaveSocket } from "@/hooks/useLeaveSocket";
import LoaderCircle from "@/components/Loader-circle";

const Leave = () => {
  const { user_id, username, roles } = useSelector((state) => state.auth.data);
  const [selectStatus, setSelectStatus] = useState("pending");
  const status = ["pending", "approved", "rejected"];
  const { data, isLoading } = useLeaveSocket(user_id, roles, selectStatus);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const handlePageChange = (page) => {
    setPageIndex(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
  };

  const onSubmit = async (data, leaveId) => {
    try {
      console.log(data);
      const payload = {
        reason: data[`alasan_${leaveId}`],
        admin: user_id,
        leave_request: leaveId,
      };
      await submitObjection(leaveId, payload).then(() => {
        // fetchData(pageIndex, pageSize, searchQuery);
      });
    } catch (err) {
      console.error("Gagal submit objection:", err);
    }
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
              {isLoading ? (
                <LoaderCircle />
              ) : (
                status.map((option) => {
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
                          // handleSearch(e.target.value);
                        }}
                        className="hidden"
                      />
                      {toProperCase(option)}
                    </label>
                  );
                })
              )}
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
                                className="bg-gray-50 rounded-xl p-4 flex flex-col justify-between gap-4"
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
                                </div>

                                {/* Reason */}
                                <div className="mb-4">
                                  <p className="text-xs text-gray-500 font-bold">
                                    Alasan izin pelatih
                                  </p>
                                  <p className="text-sm font-medium">
                                    {item.reason}
                                  </p>
                                </div>

                                {selectStatus === "pending" ? (
                                  !item.objections?.[0]?.reason ? (
                                    <form
                                      key={item.leave_id}
                                      onSubmit={handleSubmit((data) =>
                                        onSubmit(data, item.leave_id)
                                      )}
                                      className="space-y-4 my-2"
                                    >
                                      <Textinput
                                        name={`alasan_${item.leave_id}`}
                                        label="Keberatan"
                                        id={`alasan_${item.leave_id}`}
                                        type="text"
                                        // placeholder="Masukan Nama Cabang"
                                        register={register}
                                        error={errors.title}
                                      />
                                      <div className="flex flex-col gap-3">
                                        <Button
                                          icon="heroicons-outline:exclamation-triangle"
                                          text="Submit"
                                          className="btn-success  rounded-[999px] p-2"
                                          type="submit"
                                        />
                                      </div>
                                    </form>
                                  ) : (
                                    <div className="mb-4">
                                      <p className="text-xs text-gray-500 font-bold">
                                        Alasan Admin
                                      </p>
                                      <p className="text-sm font-medium">
                                        {item.objections?.[0]?.reason}
                                      </p>
                                    </div>
                                  )
                                ) : (
                                  <div className="mb-4">
                                    <p className="text-xs text-gray-500 font-bold">
                                      Alasan Admin
                                    </p>
                                    <p className="text-sm font-medium">
                                      {item.objections?.[0]?.reason}
                                    </p>
                                  </div>
                                )}

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

            {/* <PaginationComponent
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
            /> */}
          </>
        )}
      </Card>
    </div>
  );
};

export default Leave;
