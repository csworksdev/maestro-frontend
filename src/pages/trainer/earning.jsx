import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import {
  getEarningAll,
  getEarningById,
  getEarningListById,
} from "@/axios/trainer/earning";
import Loading from "@/components/Loading";
import Flatpickr from "react-flatpickr";
import { DateTime } from "luxon";

const Earning = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [listData, setListData] = useState([]);
  const [listDataDashboard, setListDataDashboard] = useState([]);
  const roles = localStorage.getItem("roles");
  const userid = localStorage.getItem("userid");

  const time = [
    { value: "06.00", label: "06.00" },
    { value: "07.00", label: "07.00" },
    { value: "08.00", label: "08.00" },
    { value: "09.00", label: "09.00" },
    { value: "10.00", label: "10.00" },
    { value: "11.00", label: "11.00" },
    { value: "12.00", label: "12.00" },
    { value: "13.00", label: "13.00" },
    { value: "14.00", label: "14.00" },
    { value: "15.00", label: "15.00" },
    { value: "16.00", label: "16.00" },
    { value: "17.00", label: "17.00" },
    { value: "18.00", label: "18.00" },
    { value: "19.00", label: "19.00" },
    { value: "20.00", label: "20.00" },
  ];

  const fetchData = async () => {
    try {
      setIsLoading(true);
      let res = [];
      if (roles === "Trainer") {
        res = await getEarningListById(userid);
        let resList = await getEarningById(userid);
        if (resList) {
          setListDataDashboard(resList.data);
        }
      } else {
        res = await getEarningAll();
      }
      setListData(res.data.data);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const groupedData = listData.reduce((acc, item) => {
    if (!acc[item.trainer_fullname]) {
      acc[item.trainer_fullname] = {};
    }

    // Extract student names from the student_names array and join them into a single string
    const studentNames = item.student_names.join(", ");

    if (!acc[item.trainer_fullname][studentNames]) {
      acc[item.trainer_fullname][studentNames] = [];
    }

    // Check if the meet has already been added
    const existingMeet = acc[item.trainer_fullname][studentNames].find(
      (meetItem) => meetItem.meet === item.meet
    );

    // Only add the meet if it hasn't been added before
    if (!existingMeet) {
      acc[item.trainer_fullname][studentNames].push(item);
    }

    return acc;
  }, {});

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
      <Card bodyClass="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {earningBlock()}
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-5">
        {Object.keys(groupedData).map((trainer_name, i) => (
          <Card title={"Coach " + trainer_name} key={i}>
            {Object.keys(groupedData[trainer_name]).map((student_name, j) => (
              <Card title={student_name.replace(",", ", ")} key={j}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {groupedData[trainer_name][student_name]
                    .sort((a, b) => a.meet - b.meet)
                    .map((item, k) => (
                      <Card
                        key={`${item.order_detail_id}-${k}`}
                        title={`Pertemuan ke ${item.meet}`}
                        // subtitle={`${item.day} - ${item.time}`}
                        noborder
                      >
                        <div>Tanggal : {item.real_date}</div>
                        <div>Jam : {item.real_time}</div>
                        <div>Kolam : {item.pool_name}</div>
                      </Card>
                    ))}
                </div>
              </Card>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Earning;
