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
import { useSelector } from "react-redux";
import Slider from "react-slick";
import useWidth from "@/hooks/useWidth";
import { useForm } from "react-hook-form";
import { jam } from "@/constant/jadwal-default";

const sliderSettings = {
  dots: true,
  infinite: false,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  responsive: [
    {
      breakpoint: 1024, // Tablet and smaller
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
      },
    },
    {
      breakpoint: 768, // Mobile
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
      },
    },
  ],
};

const Presence = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [listData, setListData] = useState([]);
  const { user_id, user_name, roles } = useSelector((state) => state.auth.data);
  const [periode, setPeriode] = useState([]);
  const { width, breakpoints } = useWidth();
  const { setValue, register } = useForm();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      let res = [];
      if (roles === "Trainer") res = await getPresenceById(user_id);
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
          title: `Siswa "${updatedData.students_info[0].fullname}"`,
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
          periode: periode.name,
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
    const formatedDate = DateTime.fromJSDate(date[0]).toFormat("yyyy-MM-dd");
    if (!date || date.length === 0) return; // Ensure date is valid
    setListData((prevListData) =>
      prevListData.map((item) =>
        item.order_detail_id === id
          ? {
              ...item,
              real_date: formatedDate,
              presence_day: DateTime.now().toFormat("yyyy-MM-dd"),
            }
          : item
      )
    );
    setValue("real_date", formatedDate);
    console.log(formatedDate);
  };

  const handleChangeTime = (id, time) => {
    if (!time) return; // Ensure time is valid
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
    console.log(time);
    setValue("real_time", time);
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
    const studentNames = item.students_info.map((s) => s.fullname).join(", ");
    if (!acc[item.order]) acc[item.order] = {};
    if (!acc[item.order][studentNames]) acc[item.order][studentNames] = [];
    acc[item.order][studentNames].push(item);
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

  const PresenceView = ({ item, k }) => {
    return (
      <>
        <Card
          key={`${item.order}-${k}`}
          title={`Pertemuan ke ${item.meet}`}
          subtitle={`${item.day} - ${item.time}`}
        >
          <div className="flex flex-col sm:flex-row items-stretch justify-between">
            <div className="w-full">
              <div>
                <label className="form-label" htmlFor="real_date">
                  Tanggal Kehadiran
                </label>
                <Flatpickr
                  value={
                    item.real_date ||
                    DateTime.fromISO(item.schedule_date).toFormat("yyyy-MM-dd")
                  }
                  options={{
                    dateFormat: "Y-m-d",
                    maxDate: DateTime.now().toFormat("yyyy-MM-dd"),
                    minDate: periode.start_date,
                    disableMobile: true,
                  }}
                  className="form-control py-2 w-full"
                  onChange={(date) =>
                    handleChangeDay(item.order_detail_id, date)
                  }
                />
              </div>
              <div>
                <label className="form-label" htmlFor="real_time">
                  Jam kehadiran
                </label>
                <select
                  name="real_time"
                  value={item.real_time || item.time} // Ensure correct mapping
                  onChange={(e) =>
                    handleChangeTime(item.order_detail_id, e.target.value)
                  }
                  className="form-select w-full"
                >
                  {jam.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                className="btn-success w-full mt-2"
                onClick={() => handleHadir(item.order_detail_id)}
              >
                Hadir
              </Button>
            </div>
          </div>
        </Card>
      </>
    );
  };

  return (
    <div className="grid grid-cols-1 justify-end gap-5 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1 lg:gap-5">
      {Object.keys(groupedData).map((order_id, i) => (
        <div key={i}>
          {Object.keys(groupedData[order_id]).map((student_name, j) => {
            // Assuming that groupedData contains the pool_name in the first item for each student
            const poolName =
              groupedData[order_id][student_name]?.[0]?.pool_name ||
              "Pool not specified";
            const order_date =
              groupedData[order_id][student_name]?.[0]?.order_date || "";
            const expire_date =
              groupedData[order_id][student_name]?.[0]?.expire_date || "";

            return (
              <Card
                subtitle={
                  <>
                    {student_name.replace(",", ", ")} <br />
                    Kolam : {poolName} <br /> Tanggal Order : {order_date}
                    <br /> Tanggal Kadaluarsa : {expire_date}
                  </>
                }
                key={j}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StudentCard
                    studentsInfo={
                      groupedData[order_id][student_name]?.[0]?.students_info ||
                      []
                    }
                  />
                  {width >= breakpoints.md &&
                    groupedData[order_id][student_name]
                      .sort((a, b) => a.meet - b.meet)
                      .map((item, k) => <PresenceView item={item} k={k} />)}
                  {width <= breakpoints.md && (
                    <Slider {...sliderSettings} key={j}>
                      {groupedData[order_id][student_name]
                        .sort((a, b) => a.meet - b.meet)
                        .map((item, k) => (
                          <PresenceView item={item} k={k} />
                        ))}
                    </Slider>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Presence;
