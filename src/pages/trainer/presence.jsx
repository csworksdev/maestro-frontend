import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import { getPresenceAll, getPresenceById } from "@/axios/trainer/presence";
import Loading from "@/components/Loading";
import Button from "@/components/ui/Button";
import Swal from "sweetalert2";
import { UpdatePresenceById } from "@/axios/trainer/presence";
import Flatpickr from "react-flatpickr";
import { DateTime } from "luxon";
import { getPeriodisasiToday } from "@/axios/referensi/periodisasi";

const Presence = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [listData, setListData] = useState([]);
  const roles = localStorage.getItem("roles");
  const userid = localStorage.getItem("userid");
  const [periode, setPeriode] = useState([]);

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
      if (roles === "Trainer") res = await getPresenceById(userid);
      else res = await getPresenceAll();
      // res = await getPresenceAll();
      setListData(res.data.data);

      const periodeResults = await getPeriodisasiToday();
      setPeriode(periodeResults.data.results[0]);
      console.log(periodeResults.data.results[0]);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (order_detail_id, updatedData) => {
    try {
      const res = await UpdatePresenceById(order_detail_id, updatedData);
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
            DateTime.fromISO(DateTime.now()).toFormat("yyyy-MM-dd"),
          presence_day:
            item.presence_day ||
            DateTime.fromISO(DateTime.now()).toFormat("yyyy-MM-dd"),
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

  if (isLoading) {
    return <Loading />;
  }

  return (
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
                        <label className="form-label" htmlFor="real_date">
                          Tanggal Kehadiran
                        </label>
                        <Flatpickr
                          defaultValue={DateTime.fromISO(
                            item.schedule_date
                          ).toFormat("yyyy-MM-dd")}
                          name="real_date"
                          options={{
                            dateFormat: "Y-m-d",
                            maxDate: DateTime.now().toFormat("yyyy-MM-dd"),
                            minDate: periode.start_date,
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
                          defaultValue={item.time}
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
                      <div className="mt-4 space-x-4 rtl:space-x-reverse">
                        <Button
                          onClick={() => handleHadir(item.order_detail_id)}
                          className="btn inline-flex justify-center btn-primary btn-sm"
                        >
                          Hadir
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
            </Card>
          ))}
        </Card>
      ))}
    </div>
  );
};

export default Presence;
