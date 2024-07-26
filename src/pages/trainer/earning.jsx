import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import { getEarningAll, getEarningById } from "@/axios/trainer/earning";
import Loading from "@/components/Loading";
import Button from "@/components/ui/Button";
import Swal from "sweetalert2";
import { EditOrderDetail } from "@/axios/masterdata/orderDetail";
import Flatpickr from "react-flatpickr";
import { DateTime } from "luxon";
import { useSelector } from "react-redux";

const Earning = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [listData, setListData] = useState([]);
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
      if (roles === "Trainer") res = await getEarningById(userid);
      else res = await getEarningAll();
      // res = await getEarningAll();
      setListData(res.data.data);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (order_detail_id, updatedData) => {
    console.log(updatedData);
    try {
      const res = await EditOrderDetail(order_detail_id, updatedData);
      if (res) {
        Swal.fire({
          title: `Siswa "${updatedData.student_names}"`,
          text: `Hari: ${updatedData.real_date}, Jam: ${updatedData.real_time}`,
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
          setListData((prevListData) =>
            prevListData.filter(
              (item) => item.order_detail_id !== order_detail_id
            )
          );
        });
      }
    } catch (error) {
      console.error("Error updating data", error);
    }
  };

  const handleChangeDay = (id, date) => {
    setListData((prevListData) =>
      prevListData.map((item) =>
        item.order_detail_id === id
          ? {
              ...item,
              real_date: DateTime.fromJSDate(date[0]).toFormat("yyyy-MM-dd"),
              presence_day: DateTime.fromJSDate(date[0]).toFormat("yyyy-MM-dd"),
            }
          : item
      )
    );
  };

  const handleChangeTime = (id, time) => {
    setListData((prevListData) =>
      prevListData.map((item) =>
        item.order_detail_id === id
          ? {
              ...item,
              real_time: time,
            }
          : item
      )
    );
  };

  const handleHadir = (order_detail_id) => {
    const updatedData = listData.map((item) => {
      if (item.order_detail_id === order_detail_id) {
        return {
          ...item,
          is_presence: true,
          real_date:
            item.real_date ||
            DateTime.fromISO(item.schedule_date).toFormat("yyyy-MM-dd"),
          presence_day:
            item.presence_day ||
            DateTime.fromISO(item.schedule_date).toFormat("yyyy-MM-dd"),
          real_time: item.real_time || item.time,
        };
      }
      return item;
    });

    const updatedItem = updatedData.find(
      (item) => item.order_detail_id === order_detail_id
    );

    setListData(updatedData);
    handleUpdate(order_detail_id, updatedItem);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const groupedData = listData.reduce((acc, item) => {
    if (!acc[item.trainer_fullname]) {
      acc[item.trainer_fullname] = {};
    }
    if (!acc[item.trainer_fullname][item.student_names]) {
      acc[item.trainer_fullname][item.student_names] = [];
    }
    acc[item.trainer_fullname][item.student_names].push(item);
    return acc;
  }, {});

  const statistics = [
    {
      // name: shapeLine1,
      title: "Total Earning",
      count: "Rp. 9.999.999",
      bg: "bg-[#E5F9FF] dark:bg-slate-900	",
    },
    {
      // name: shapeLine2,
      title: "Available Earning",
      count: "Rp. 7.000.000",
      bg: "bg-[#FFEDE5] dark:bg-slate-900	",
    },
    {
      // name: shapeLine3,
      title: "Unpaid",
      count: "Rp. 5.000.000",
      bg: "bg-[#EAE5FF] dark:bg-slate-900	",
    },
    {
      // name: shapeLine3,
      title: "Potensial",
      count: "Rp. 5.000.000",
      bg: "bg-[#EAE5FF] dark:bg-slate-900	",
    },
  ];

  if (isLoading) {
    return <Loading />;
  }

  const earningBlock = () => {
    return (
      <>
        {statistics.map((item, i) => (
          <div className={`py-[18px] px-4 rounded-[6px] ${item.bg}`} key={i}>
            <div className="flex items-center space-x-6 rtl:space-x-reverse">
              <div className="flex-none">
                {/* <Chart
              options={item.name.options}
              series={item.name.series}
              type="area"
              height={48}
              width={48}
            /> */}
              </div>
              <div className="flex-1">
                <div className="text-slate-800 dark:text-slate-300 text-lg mb-1 font-medium">
                  {item.title}
                </div>
                <div className="text-slate-900 dark:text-white text-4xl font-medium text-right">
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
      <div className="2xl:col-span-9 lg:col-span-8 col-span-12">
        <Card bodyClass="p-4">
          <div className="grid md:grid-cols-3 col-span-1 gap-4">
            {earningBlock()}
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-1 justify-end gap-5 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1 lg:gap-5">
        {Object.keys(groupedData).map((trainer_name, i) => (
          <Card title={"Coach " + trainer_name} key={i}>
            {Object.keys(groupedData[trainer_name]).map((student_name, j) => (
              <Card title={student_name.replace(",", " & ")} key={j}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {groupedData[trainer_name][student_name]
                    .sort((a, b) => a.meet - b.meet)
                    .map((item, k) => (
                      <Card
                        key={`${item.order_detail_id}-${k}`}
                        title={`Pertemuan ke ${item.meet}`}
                        subtitle={`${item.day} - ${item.time}`}
                        noborder
                      >
                        <div>
                          <span></span>
                        </div>
                        <div>
                          <label className="form-label" htmlFor="real_date">
                            Tanggal Kehadiran
                          </label>
                          <Flatpickr
                            defaultValue={DateTime.fromISO(
                              item.real_date
                            ).toFormat("yyyy-MM-dd")}
                            name="real_date"
                            options={{
                              dateFormat: "Y-m-d",
                              maxDate: DateTime.now().toFormat("yyyy-MM-dd"),
                            }}
                            className="form-control py-2"
                            onChange={(date) =>
                              handleChangeDay(item.order_detail_id, date)
                            }
                            style={{ background: "#ffffff", color: "inherit" }}
                          />
                        </div>
                        <div>
                          <label className="form-label" htmlFor="real_time">
                            Jam kehadiran
                          </label>
                          <select
                            name="real_time"
                            defaultValue={item.real_time}
                            onChange={(e) =>
                              handleChangeTime(
                                item.order_detail_id,
                                e.target.value
                              )
                            }
                            className="form-select"
                          >
                            {time.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        {/* <div className="mt-4 space-x-4 rtl:space-x-reverse">
                        <Button
                          onClick={() => handleHadir(item.order_detail_id)}
                          className="btn inline-flex justify-center btn-primary btn-sm"
                        >
                          Hadir
                        </Button>
                      </div> */}
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
