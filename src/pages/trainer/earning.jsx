import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import {
  getEarningAll,
  getEarningById,
  getEarningListById,
} from "@/axios/trainer/earning";
import Loading from "@/components/Loading";
import { useAuthStore } from "@/redux/slicers/authSlice";
import Search from "@/components/globals/table/search";
import dayjs from "dayjs";
import "dayjs/locale/id";

dayjs.locale("id");

const Earning = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [listData, setListData] = useState([]);
  const [listDataDashboard, setListDataDashboard] = useState([]);
  const [groupedData, setGroupedData] = useState({});
  const { user_id, roles } = useAuthStore((state) => state.data);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      setIsLoading(true);
      let res = [];
      // if (roles === "Trainer") {
      res = await getEarningListById(user_id);
      // let resList = await getEarningById(user_id);
      // if (resList) {
      //   setListDataDashboard(resList.data);
      // }
      // } else {
      //   res = await getEarningAll();
      // }
      setListData(res.data.data);

      // Group data initially
      const initialGroupedData = groupData(res.data.data);
      setGroupedData(initialGroupedData);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const groupData = (data) => {
    return data.reduce((acc, item) => {
      if (!acc[item.order]) {
        acc[item.order] = {};
      }

      if (!acc[item.order][item.trainer_fullname]) {
        acc[item.order][item.trainer_fullname] = {};
      }

      const studentNames = item.student_names.join(", ");
      if (!acc[item.order][item.trainer_fullname][studentNames]) {
        acc[item.order][item.trainer_fullname][studentNames] = [];
      }

      acc[item.order][item.trainer_fullname][studentNames].push(item);

      return acc;
    }, {});
  };

  const handleSearch = (query) => {
    setSearchQuery(query.toLowerCase());

    if (!query) {
      // If search query is empty, reset to all data
      const initialGroupedData = groupData(listData);
      setGroupedData(initialGroupedData);
      return;
    }

    // Filter the listData based on the query
    const filteredListData = listData.filter((item) =>
      item.student_names.some((name) =>
        name.toLowerCase().includes(query.toLowerCase())
      )
    );

    // Regroup the filtered data
    const filteredGroupedData = groupData(filteredListData);
    setGroupedData(filteredGroupedData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statistics = [
    {
      title: "Total Pendapatan",
      count: "Rp. 0",
      bg: "bg-[#E5F9FF] dark:bg-slate-900",
    },
    // {
    //   title: "Available Earning",
    //   count: "Rp. 7.000.000",
    //   bg: "bg-[#FFEDE5] dark:bg-slate-900",
    // },
    {
      title: "Bulan ini",
      count: "Rp. 0",
      bg: "bg-[#EAE5FF] dark:bg-slate-900",
    },
    // {
    //   title: "Potential",
    //   count: "Rp. 5.000.000",
    //   bg: "bg-[#faf4a5] dark:bg-slate-900",
    // },
  ];

  if (isLoading) {
    return <Loading />;
  }

  const addCommas = (num) => {
    if (num) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    return num;
  };

  const removeNonNumeric = (num) => num.toString().replace(/[^0-9]/g, "");
  const formatMeetingDate = (dateString) => {
    if (!dateString) return "";
    const parsed = dayjs(dateString);
    return parsed.isValid() ? parsed.format("DD/MM") : "";
  };

  const formatFullDate = (dateString) => {
    if (!dateString) return "-";
    const parsed = dayjs(dateString);
    return parsed.isValid() ? parsed.format("DD MMMM YYYY") : dateString;
  };

  const getMutasiDetail = (entry = {}) => {
    const candidates = [
      entry?.mutasi_detail,
      entry?.mutasi_detail_label,
      entry?.mutasi_badge_label,
      entry?.mutasi_description,
      entry?.mutasi_info,
    ];
    return (
      candidates.find(
        (value) => typeof value === "string" && value.trim().length > 0
      ) || ""
    );
  };

  const earningBlock = () => {
    const { total, available, unpaid, potencial } = listDataDashboard;
    statistics[0].count = "Rp. " + addCommas(total);
    // statistics[1].count = "Rp. " + addCommas(available);
    statistics[1].count = "Rp. " + addCommas(unpaid);
    // statistics[3].count = "Rp. " + addCommas(potencial);
    return (
      <>
        {statistics.map((item, i) => (
          <div className={`py-[18px] px-4 rounded-[6px] ${item.bg}`} key={i}>
            <div className="flex items-center space-x-6 rtl:space-x-reverse">
              <div className="flex-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                  width={50}
                  height={50}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-slate-800 dark:text-slate-300 text-md mb-1 font-medium">
                  {item.title}
                </div>
                <div className="text-slate-900 dark:text-white text-xl font-bold text-right">
                  {item.count}
                </div>
              </div>
            </div>
          </div>
        ))}
      </>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-5 mb-5">
      {/* di hide dulu */}
      {/* <Card bodyClass="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {earningBlock()}
      </div>
    </Card> */}
      <Search
        handleSearch={(query) => handleSearch(query)}
        searchValue={searchQuery}
        placeholder="Cari Siswa"
      />
      <div className="grid grid-cols-1 gap-5">
        {Object.keys(groupedData).map((order_id, i) =>
          Object.keys(groupedData[order_id]).map((trainer_name, j) =>
            Object.keys(groupedData[order_id][trainer_name]).map(
              (student_name, k) => {
                const studentEntries =
                  groupedData[order_id][trainer_name][student_name] || [];
                const firstEntry = studentEntries[0] || {};
                const order_date = firstEntry?.order_date || "";
                const expire_date = firstEntry?.expire_date || "";
                const formattedStudentName = student_name
                  .split(",")
                  .map((name) => name.trim())
                  .join(", ");
                const orderDateDisplay = formatFullDate(order_date);
                const expireDateDisplay = formatFullDate(expire_date);
                const totalSessions = studentEntries.length;
                const mutasiDetail = getMutasiDetail(firstEntry);
                const hasMutasiDetail = Boolean(mutasiDetail);

                return (
                  <Card
                    key={k}
                    className="border border-slate-100 shadow-none sm:shadow-sm"
                    bodyClass="p-4 sm:p-6"
                    headerslot={
                      <div className="flex flex-col items-end gap-2 text-right">
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-900">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          {totalSessions} Sesi
                        </span>
                        {hasMutasiDetail && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            {mutasiDetail}
                          </span>
                        )}
                      </div>
                    }
                    subtitle={
                      <div className="flex flex-col gap-3 text-sm text-slate-600">
                        <div className="flex flex-col gap-1">
                          <p className="text-base font-semibold text-slate-900">
                            {formattedStudentName}
                          </p>
                        </div>
                        <dl className="grid gap-2 rounded-2xl bg-slate-50/70 p-3 text-xs text-slate-500 sm:grid-cols-2">
                          <div>
                            <dt className="uppercase tracking-wide">
                              Tanggal Order
                            </dt>
                            <dd className="font-semibold text-slate-700">
                              {orderDateDisplay}
                            </dd>
                          </div>
                          <div>
                            <dt className="uppercase tracking-wide">
                              Tanggal Kadaluarsa
                            </dt>
                            <dd className="font-semibold text-slate-700">
                              {expireDateDisplay}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    }
                  >
                    <div className="grid grid-cols-4 gap-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
                      {[
                        ...(groupedData[order_id][trainer_name][student_name] ||
                          []),
                      ]
                        .sort((a, b) => a.meet - b.meet)
                        .map((item, l) => {
                          const formattedDate = formatMeetingDate(
                            item.real_date
                          );
                          const hasDate = Boolean(item.real_date);
                          const displayDate = hasDate
                            ? formattedDate || item.real_date
                            : "Belum diisi";
                          return (
                            <div
                              key={`${item.order_detail_id}-${l}`}
                              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="flex flex-col">
                                  {/* <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                                    Pertemuan
                                  </p> */}
                                  <p className="text-2xl font-semibold leading-tight text-slate-900">
                                    #{item.meet || "-"}
                                  </p>
                                </div>
                                <span className="inline-flex items-center rounded-xl bg-sky-50 px-1 py-1 text-xs font-semibold text-sky-600">
                                  {displayDate}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </Card>
                );
              }
            )
          )
        )}
      </div>
    </div>
  );
};

export default Earning;
