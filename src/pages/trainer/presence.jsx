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
import { meets } from "@/constant/data";
import button from "../components/button";
import Icons from "@/components/ui/Icon";

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
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (order_id, updatedData) => {
    try {
      const res = await UpdatePresenceById(order_id, updatedData);
      if (res) {
        Swal.fire({
          title: `Siswa "${updatedData.student_names}"`,
          text: `Hari: ${updatedData.real_date}, Jam: ${updatedData.real_time}`,
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
          fetchData();
        });
      }
    } catch (error) {
      console.error("Error updating data", error);
    }
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
          presence_day: DateTime.fromISO(DateTime.now()).toFormat("yyyy-MM-dd"),
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
    // handleUpdate(updatedItem.order, updatedItem);
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

  useEffect(() => {
    fetchData();
  }, []);

  function convertToTitleCase(str) {
    if (!str) {
      return "";
    }

    return str
      .toLowerCase()
      .split(" ")
      .map(function (word) {
        return word.charAt(0).toUpperCase().concat(word.substr(1));
      })
      .join(" ");
  }

  const groupedData = listData.reduce((acc, item) => {
    if (!acc[item.trainer_fullname]) {
      acc[item.trainer_fullname] = {};
    }

    // Extract student names from the students_info array
    const studentNames = item.students_info
      .map((student) => convertToTitleCase(student.fullname))
      .join(", ");

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

  // WhatsApp link generator function
  const getWhatsAppLink = (phone, name) => {
    const countryCode = "+62"; // Indonesia country code, modify as per your requirement
    return `https://wa.me/${countryCode}${phone}/?text=hi, ${name}`;
  };

  const StudentCard = ({ studentsInfo }) => {
    return (
      <Card title={"Kontak Siswa"}>
        {studentsInfo.map((student, index) => (
          <div
            key={index}
            className="grid grid-cols-2 gap-2 items-center border-b-2 py-2"
          >
            <div>{convertToTitleCase(student.fullname)}</div>
            <div className="flex h-min justify-center align-middle">
              {student.phone ? (
                <Button
                  variant="contained"
                  // href={getWhatsAppLink(student.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-success btn-sm"
                  link={getWhatsAppLink(student.phone, student.fullname)}
                >
                  chat wa
                </Button>
              ) : (
                <Button
                  className="opacity-40 cursor-not-allowed
         btn-secondary btn-sm"
                >
                  X
                </Button>
              )}
            </div>
          </div>
        ))}
      </Card>
    );
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="grid grid-cols-1 justify-end gap-5 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1 lg:gap-5">
      {Object.keys(groupedData).map((trainer_name, i) => (
        // <Card subtitle={"Coach " + trainer_name} key={i}>
        <>
          {Object.keys(groupedData[trainer_name] || {}).map(
            (student_name, j) => {
              // Assuming that groupedData contains the pool_name in the first item for each student
              const poolName =
                groupedData[trainer_name][student_name]?.[0]?.pool_name ||
                "Pool not specified";

              return (
                <Card
                  subtitle={`${student_name.replace(",", ", ")} - ${poolName}`}
                  key={j}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StudentCard
                      studentsInfo={
                        groupedData[trainer_name][student_name]?.[0]
                          ?.students_info || []
                      }
                    />
                    {groupedData[trainer_name][student_name]
                      .sort((a, b) => a.meet - b.meet)
                      .map((item, k) => (
                        <Card
                          key={`${item.order}-${k}`}
                          title={`Pertemuan ke ${item.meet}`}
                          subtitle={`${item.day} - ${item.time}`}
                        >
                          <div>
                            <label className="form-label" htmlFor="real_date">
                              Tanggal Kehadiran
                            </label>
                            {console.log(
                              DateTime.fromISO(item.schedule_date).toFormat(
                                "yyyy-MM-dd"
                              )
                            )}
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
                              style={{
                                background: "#ffffff",
                                color: "inherit",
                              }}
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
              );
            }
          )}
        </>
        // </Card>
      ))}
    </div>
  );
};

export default Presence;
