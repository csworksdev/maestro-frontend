import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import {
  getEarningAll,
  getEarningById,
  getEarningListById,
} from "@/axios/trainer/earning";
import Loading from "@/components/Loading";
import { useSelector } from "react-redux";
import Search from "@/components/globals/table/search";

const Earning = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [listData, setListData] = useState([]);
  const [listDataDashboard, setListDataDashboard] = useState([]);
  const [groupedData, setGroupedData] = useState({});
  const { user_id, roles } = useSelector((state) => state.auth.data);
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
                const order_date =
                  groupedData[order_id][trainer_name][student_name]?.[0]
                    ?.order_date || "";
                const expire_date =
                  groupedData[order_id][trainer_name][student_name]?.[0]
                    ?.expire_date || "";
                const day =
                  groupedData[order_id][trainer_name][student_name]?.[0]?.day ||
                  "";

                return (
                  <Card
                    subtitle={
                      <>
                        {student_name.replace(",", ", ")} <br />
                        Kolam:{" "}
                        {groupedData[order_id][trainer_name][student_name]?.[0]
                          ?.pool_name || "Pool not specified"}{" "}
                        <br />
                        Tanggal Order: {order_date}
                        <br />
                        Tanggal Kadaluarsa: {expire_date}
                        <br />
                        Hari: {day}
                      </>
                    }
                    key={k}
                  >
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {groupedData[order_id][trainer_name][student_name]
                        .sort((a, b) => a.meet - b.meet)
                        .map((item, l) => (
                          <Card
                            key={`${item.order_detail_id}-${l}`}
                            bodyClass="p-3"
                            tit
                            className="bg-gradient-to-br from-sky-400 via-sky-400 to-violet-400 p-3 rounded-2xl w-full text-white flex items-center justify-between max-w-2xl mx-auto"
                          >
                            <span className="text-sm font-semibold">
                              Pertemuan ke : {item.meet || "N/A"}
                            </span>
                            <br />
                            <span className="text-sm">
                              Tanggal: {item.real_date || "N/A"}
                            </span>
                            <br />
                            <span className="text-sm">
                              Hari: {item.day || "N/A"}
                            </span>
                            <br />
                            <span className="text-sm">
                              Jam: {item.real_time || "N/A"}
                            </span>
                            {/* <br /> */}
                            {/* <span className="text-sm">
                              Kolam: {item.pool_name || "N/A"}
                            </span> */}
                          </Card>
                        ))}
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
