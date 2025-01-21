import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import { getPresenceById } from "@/axios/trainer/presence";
import Loading from "@/components/Loading";
import Button from "@/components/ui/Button";
import Swal from "sweetalert2";
import { UpdatePresenceById } from "@/axios/trainer/presence";
import Flatpickr from "react-flatpickr";
import { DateTime } from "luxon";
import { getPeriodisasiToday } from "@/axios/referensi/periodisasi";
import { useSelector } from "react-redux";
import Slider from "react-slick";
import useWidth from "@/hooks/useWidth";
import { useForm } from "react-hook-form";
import { hari, jam } from "@/constant/jadwal-default";
import { EditOrder } from "@/axios/masterdata/order";
import Search from "@/components/globals/table/search";
import { startCase, toLower } from "lodash";

import Notfound from "@/assets/images/svg/notfound.svg";
import { Disclosure, Tab } from "@headlessui/react";
import Icon from "@/components/ui/Icon";

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
  const { setValue } = useForm();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOld, setIsOld] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(
    localStorage.getItem("presenceSelected") || 0
  );

  const daysOfWeek = [
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
    "Minggu",
  ];

  const [tabHari, setTabHari] = useState(
    daysOfWeek.map((hari) => ({ hari, data: [] }))
  );

  useEffect(() => {
    if (tabHari.length && tabHari[selectedIndex]?.data) {
      setListData(tabHari[selectedIndex].data);
    }
    localStorage.setItem("presenceSelected", selectedIndex);
  }, [selectedIndex, tabHari]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      let res = await getPresenceById(user_id);

      // setListData(res.data.data);
      splitPerDay(res.data.data);

      const periodeResults = await getPeriodisasiToday();
      setPeriode(periodeResults.data.results[0]);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setIsLoading(false);
    }
  };

  // const groupedData = listData.reduce((acc, item) => {
  //   const studentNames = item.students_info
  //     .map((s) => convertToTitleCase(s.fullname))
  //     .join(", ");
  //   if (!acc[item.order]) acc[item.order] = {};
  //   if (!acc[item.order][studentNames]) acc[item.order][studentNames] = [];
  //   acc[item.order][studentNames].push(item);
  //   return acc;
  // }, {});

  const splitPerDay = (data) => {
    const updatedTabHari = daysOfWeek.map((hari) => ({
      hari,
      data: data.filter((item) => item.day === hari),
    }));
    setTabHari(updatedTabHari);
  };

  // Updated handleSearch
  const handleSearch = (query) => {
    setSearchQuery(query); // Update only the search query state

    // Filter tabHari's data based on the search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      setTabHari((prevTabHari) =>
        prevTabHari.map((tab) => ({
          ...tab,
          data: tab.data.filter((item) =>
            item.students_info.some((student) =>
              student.fullname.toLowerCase().includes(lowerQuery)
            )
          ),
        }))
      );
    } else {
      // If search query is empty, retain the original tabHari data
      fetchData(); // Or restore the unfiltered state if data is cached
    }
  };

  const checkProduct = (updatedData) => {
    const { product, meet, order_id, order_date } = updatedData;
    let expire_day = 0;
    let isFinish = false;

    if (product.includes("trial")) {
      expire_day = 1;
      isFinish = true;
    } else if (
      product.includes("4") ||
      product.includes("grup") ||
      product.includes("terapi") ||
      product.includes("baby")
    ) {
      expire_day = 60;
      isFinish = meet === 4;
    } else if (product.includes("8")) {
      expire_day = 90;
      isFinish = meet === 8;
    }

    const updatedOrder = {
      order_id,
      is_finish: isFinish,
      ...(isFinish && {
        expire_date:
          meet === 1
            ? DateTime.fromISO(order_date)
                .plus({ days: expire_day })
                .toFormat("yyyy-MM-dd")
            : undefined,
      }),
    };

    return isFinish ? updatedOrder : null;
  };

  const checkMeetThreshold = (updatedData) => {
    const { order_id, meet: threshold } = updatedData;

    // Flatten all data arrays in tabHari and check if any meeting has a meet value less than the threshold
    const hasLessThanThreshold = tabHari
      .flatMap((tab) => tab.data)
      .some((item) => item.order_id === order_id && item.meet < threshold);

    // Return true if no such meeting exists, otherwise false
    return !hasLessThanThreshold;
  };

  const handleUpdate = async (order_id, updatedData) => {
    try {
      const confirmation = await Swal.fire({
        title: "Apakah anda yakin ingin absen siswa berikut?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#22c55e",
        cancelButtonColor: "#ef4444",
        confirmButtonText: "Hadir",
        html: `
          <div>
            <strong>Nama Siswa:</strong><br />
            ${updatedData.students_info
              .map((item) => item.fullname)
              .join("<br />")}<br />
            <strong>Pertemuan ke:</strong> ${updatedData.meet}<br />
            <strong>Tanggal:</strong> ${updatedData.real_date}<br />
            <strong>Jam:</strong> ${updatedData.real_time}
          </div>
        `,
      });

      if (!confirmation.isConfirmed) return;

      if (!checkMeetThreshold(updatedData)) {
        await Swal.fire({
          title: "Oops!",
          text: "Silahkan isi pertemuan sebelumnya.",
          icon: "error",
          confirmButtonText: "OK",
        });
        return;
      }

      const params = [
        {
          order: updatedData.order_id,
          meet: updatedData.meet,
          is_presence: true,
          real_date: updatedData.real_date,
          real_time: updatedData.real_time,
          presence_day: DateTime.now().toFormat("yyyy-MM-dd"),
        },
      ];

      const updateRes = await UpdatePresenceById(order_id, params);
      if (!updateRes) throw new Error("Failed to update presence");

      const updateOrder = checkProduct(updatedData);
      if (updateOrder && updateOrder.is_finish) {
        const editRes = await EditOrder(updateOrder.order_id, updateOrder);
        if (!editRes?.status) throw new Error("Failed to edit order");
      }

      await Swal.fire({
        title: `Siswa "${updatedData.students_info[0].fullname}"`,
        text: `Hari: ${updatedData.real_date}, Jam: ${updatedData.real_time}`,
        icon: "success",
        confirmButtonText: "OK",
      });

      fetchData();
    } catch (error) {
      await Swal.fire({
        title: "Error",
        text: "Terjadi kesalahan saat memproses data. Silakan coba lagi.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  // const handleHadir = (order_detail_id) => {
  //   const updatedData = listData.map((item) => {
  //     if (item.order_detail_id === order_detail_id) {
  //       return {
  //         ...item,
  //         is_presence: true,
  //         periode: periode.name,
  //         real_date: item.real_date || item.schedule_date,
  //         presence_day: DateTime.fromISO(DateTime.now()).toFormat("yyyy-MM-dd"),
  //         real_time: item.real_time || item.time,
  //       };
  //     }
  //     return item;
  //   });

  //   const updatedItem = updatedData.find(
  //     (item) => item.order_detail_id === order_detail_id
  //   );
  // setListData(updatedData);
  // handleUpdate(order_detail_id, updatedItem);
  // };

  const handleHadir = async (order_detail_id) => {
    await setTabHari((prevTabHari) =>
      prevTabHari.map((tab) => ({
        ...tab,
        data: tab.data.map((item) => {
          if (item.order_detail_id === order_detail_id) {
            return {
              ...item,
              is_presence: true,
              periode: periode.name,
              real_date: item.real_date || item.schedule_date,
              presence_day: DateTime.now().toFormat("yyyy-MM-dd"),
              real_time: item.real_time || item.time,
            };
          }
          return item;
        }),
      }))
    );

    const updatedItem = tabHari
      .flatMap((tab) => tab.data)
      .find((item) => item.order_detail_id === order_detail_id);

    // console.log("Updated item:", updatedItem); // Debugging
    await handleUpdate(order_detail_id, updatedItem);
  };

  const handleChangeDay = async (id, date) => {
    if (!date) {
      console.error("Invalid date:", date);
      return; // Ensure date is valid
    }

    const formattedDate = DateTime.fromJSDate(date).toFormat("yyyy-MM-dd");
    await setValue("real_date", formattedDate);

    // Update tabHari state
    await setTabHari((prevTabHari) =>
      prevTabHari.map((tab) => ({
        ...tab,
        data: tab.data.map((item) =>
          item.order_detail_id === id
            ? {
                ...item,
                real_date: formattedDate,
                presence_day: DateTime.now().toFormat("yyyy-MM-dd"),
              }
            : item
        ),
      }))
    );
  };

  const handleChangeTime = async (id, time) => {
    if (!time) return; // Ensure time is valid

    await setValue("real_time", time);

    // Update tabHari state
    await setTabHari((prevTabHari) =>
      prevTabHari.map((tab) => ({
        ...tab,
        data: tab.data.map((item) =>
          item.order_detail_id === id
            ? {
                ...item,
                real_time: time,
              }
            : item
        ),
      }))
    );
  };

  const handleChangeTab = (index) => {
    setSelectedIndex(index);
    setListData(tabHari[index].data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  function convertToTitleCase(str) {
    return startCase(toLower(str));
  }

  // WhatsApp link generator function
  const getWhatsAppLink = (phone, name) => {
    const countryCode = "+62"; // Indonesia country code, modify as per your requirement
    return `https://wa.me/${countryCode}${phone}/?text=hi, ${name}`;
  };

  const StudentCard = ({ studentsInfo }) => {
    return (
      <Disclosure as="div">
        <Disclosure.Button className="group flex w-full items-center justify-between">
          <button className="text-sm/6 font-medium group-data-[hover]:text-black-50/80">
            Kontak Siswa
          </button>
          <Icon
            icon="heroicons-outline:chevron-top"
            color={"#"}
            className="size-5 fill-white/60 group-data-[hover]:fill-white/50 group-data-[open]:rotate-180"
          />
        </Disclosure.Button>
        <Disclosure.Panel className="text-gray-500">
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
        </Disclosure.Panel>
      </Disclosure>
    );
  };

  if (isLoading) {
    return <Loading />;
  }

  const PresenceView = ({ item, k }) => (
    <Card
      key={`${item.order}-${k}`}
      title={`Pertemuan ke ${item.meet}`}
      subtitle={`${item.day} - ${item.time}`}
    >
      <div className="flex flex-col sm:flex-row items-stretch justify-between">
        <div className="w-full">
          <label className="form-label" htmlFor="real_date">
            Tanggal Kehadiran
          </label>
          <Flatpickr
            value={item.real_date || item.schedule_date}
            options={{
              minDate: DateTime.fromISO(periode.start_date)
                .minus({ month: 1 })
                .toISODate(),
              maxDate: DateTime.fromISO(periode.end_date)
                .minus({ month: 1 })
                .toISODate(),
              disableMobile: true,
              allowInput: true,
              altInput: true,
              altFormat: "d F Y",
            }}
            className="form-control py-2 w-full"
            onChange={(selectedDate) =>
              handleChangeDay(item.order_detail_id, selectedDate?.[0])
            }
          />
          <label className="form-label mt-2" htmlFor="real_time">
            Jam kehadiran
          </label>
          <select
            name="real_time"
            value={item.real_time || item.time}
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
          <Button
            className="btn-success w-full mt-2"
            onClick={() => handleHadir(item.order_detail_id)}
          >
            Hadir
          </Button>
        </div>
      </div>
    </Card>
  );

  const DisplayData = (data) => {
    const groupedData = data.reduce((acc, item) => {
      const studentNames = item.students_info
        .map((s) => convertToTitleCase(s.fullname))
        .join(", ");
      if (!acc[item.order]) acc[item.order] = {};
      if (!acc[item.order][studentNames]) acc[item.order][studentNames] = [];
      acc[item.order][studentNames].push(item);
      return acc;
    }, {});

    // setListData(groupedData);
    return (
      <>
        <Search
          handleSearch={(query) => handleSearch(query)}
          searchValue={searchQuery} // Bind searchQuery as the value
          placeholder={`Cari siswa hari ${hari[selectedIndex].value}`}
        />

        <div className="grid grid-cols-1 justify-end gap-5 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1 lg:gap-5">
          {Object.keys(groupedData).map((order_id, i) => (
            <div key={i}>
              {Object.keys(groupedData[order_id]).map((student_name, j) => {
                // Assuming that groupedData contains the pool_name in the first item for each student
                const poolName =
                  groupedData[order_id][student_name]?.[j]?.pool_name ||
                  "Pool not specified";
                const order_date =
                  groupedData[order_id][student_name]?.[j]?.order_date || "";
                const expire_date =
                  groupedData[order_id][student_name]?.[j]?.expire_date ||
                  "Belum mulai latihan.";
                const hari =
                  groupedData[order_id][student_name]?.[j]?.day || "";
                return (
                  <Card
                    subtitle={
                      <>
                        {student_name.replace(",", ", ")} <br />
                        Kolam : {poolName} <br /> Tanggal Order : {order_date}
                        <br /> Tanggal Kadaluarsa : {expire_date}
                        <br /> Hari : {hari}
                        <br />
                        <StudentCard
                          studentsInfo={
                            groupedData[order_id][student_name]?.[0]
                              ?.students_info || []
                          }
                          key={i + j}
                        />
                      </>
                    }
                    key={i + j}
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {width >= breakpoints.md &&
                        groupedData[order_id][student_name]
                          .sort((a, b) => a.meet - b.meet)
                          .map((item, k) => (
                            <PresenceView item={item} k={i + j + k} />
                          ))}
                      {width <= breakpoints.md && (
                        <Slider {...sliderSettings} key={j}>
                          {groupedData[order_id][student_name]
                            .sort((a, b) => a.meet - b.meet)
                            .map((item, k) => (
                              <PresenceView item={item} k={i + j + k} />
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
      </>
    );
  };

  const DataNotFound = () => {
    return (
      <div className="flex flex-col items-center">
        <img src={Notfound} alt="" className="object-contain max-h-32 " />
        <span className="text-lg">Tidak ada jadwal dihari ini</span>
      </div>
    );
  };

  const TabbedVersion = () => {
    return (
      <Tab.Group selectedIndex={selectedIndex ?? -1} onChange={handleChangeTab}>
        {/* Tab List */}
        <Tab.List className="flex-nowrap overflow-x-auto whitespace-nowrap flex gap-3 my-4 pb-1">
          {tabHari.map((item, i) => (
            <Tab key={i}>
              {({ selected }) => (
                <button
                  className={`text-sm font-medium mb-7 last:mb-0 capitalize px-6 py-2 rounded-md transition duration-150 focus:outline-none ring-0
          ${
            selected
              ? "text-white bg-primary-500"
              : "text-slate-500 bg-white dark:bg-slate-700 dark:text-slate-300"
          }`}
                >
                  {`${item.hari}`}
                </button>
              )}
            </Tab>
          ))}
        </Tab.List>

        {/* Tab Panels */}
        <Tab.Panels>
          {tabHari.map((item, i) => (
            <Tab.Panel key={i} className={"h-auto"}>
              <div className="text-slate-600 dark:text-slate-400 text-sm font-normal">
                {item.data.length ? DisplayData(item.data) : DataNotFound()}
              </div>
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    );
  };

  return (
    <>
      {/* <Search
            handleSearch={(query) => handleSearch(query)}
            searchValue={searchQuery}
            placeholder="Cari siswa hari"
          /> */}
      {isOld ? (
        <>
          <div className="grid grid-cols-1 justify-end gap-5 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1 lg:gap-5">
            {Object.keys(groupedData).map((order_id, i) => (
              <div key={i}>
                {Object.keys(groupedData[order_id]).map((student_name, j) => {
                  // Assuming that groupedData contains the pool_name in the first item for each student
                  const poolName =
                    groupedData[order_id][student_name]?.[j]?.pool_name ||
                    "Pool not specified";
                  const order_date =
                    groupedData[order_id][student_name]?.[j]?.order_date || "";
                  const expire_date =
                    groupedData[order_id][student_name]?.[j]?.expire_date ||
                    "Belum mulai latihan.";
                  const hari =
                    groupedData[order_id][student_name]?.[j]?.day || "";
                  return (
                    <Card
                      subtitle={
                        <>
                          {student_name.replace(",", ", ")} <br />
                          Kolam : {poolName} <br /> Tanggal Order : {order_date}
                          <br /> Tanggal Kadaluarsa : {expire_date}
                          <br /> Hari : {hari}
                        </>
                      }
                      key={i + j}
                    >
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StudentCard
                          studentsInfo={
                            groupedData[order_id][student_name]?.[0]
                              ?.students_info || []
                          }
                          key={i + j}
                        />
                        {width >= breakpoints.md &&
                          groupedData[order_id][student_name]
                            .sort((a, b) => a.meet - b.meet)
                            .map((item, k) => (
                              <PresenceView item={item} k={i + j + k} />
                            ))}
                        {width <= breakpoints.md && (
                          <Slider {...sliderSettings} key={j}>
                            {groupedData[order_id][student_name]
                              .sort((a, b) => a.meet - b.meet)
                              .map((item, k) => (
                                <PresenceView item={item} k={i + j + k} />
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
        </>
      ) : (
        <TabbedVersion />
      )}
    </>
  );
};

export default Presence;
