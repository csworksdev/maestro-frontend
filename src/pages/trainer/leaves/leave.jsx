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
import { DateTime } from "luxon";
import { toProperCase } from "@/utils";
import Radio from "@/components/ui/Radio";
import { Icon } from "@iconify/react";
import { useRef } from "react";
import { useLeaveSocket } from "@/hooks/useLeaveSocket";
import LoaderCircle from "@/components/Loader-circle";

const Leave = () => {
  const navigate = useNavigate();
  const { user_id, username, roles } = useSelector((state) => state.auth.data);
  const status = ["pending", "approved", "rejected"];
  const [selectStatus, setSelectStatus] = useState("pending");

  const { data, isLoading } = useLeaveSocket(user_id, roles, selectStatus);

  return (
    <div className="grid grid-cols-1 justify-end">
      <Card
        title="Pengajuan Izin"
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

            <div className="w-full p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.map((item, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow p-4">
                    {/* Header Info */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                      <div className="text-sm">
                        <p className="text-gray-500">Tanggal Izin</p>
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

                    {/* Reason */}
                    <div className="mb-4 border border-yellow-300 rounded-2xl p-2 flex items-start gap-2">
                      {/* Icon di kiri */}
                      <Icon
                        icon="heroicons-outline:information-circle"
                        className="w-5 h-5 text-yellow-500 mt-0.5"
                      />

                      {/* Teks di kanan */}
                      {item.objections?.[0]?.reason ? (
                        <div>
                          <p className="text-xs text-gray-500">Info Admin :</p>
                          <p className="text-sm font-medium">
                            {item.objections[0]?.reason}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-gray-500">
                            Admin belum memberikan keterangan
                          </p>
                        </div>
                      )}
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
