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
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { hari, jam } from "@/constant/jadwal-default";
import { EditOrder } from "@/axios/masterdata/order";
import Search from "@/components/globals/table/search";
import { startCase, toLower } from "lodash";

import Notfound from "@/assets/images/svg/notfound.svg";
import { Disclosure, Tab } from "@headlessui/react";
import Icon from "@/components/ui/Icon";
import { useDispatch } from "react-redux";
import { setLoading } from "@/redux/slicers/loadingSlice";
import useScrollRestoration from "@/hooks/useScrollRestoration";

const sliderSettings = {
  dots: true,
  infinite: false,
  speed: 500,
  slidesToShow: 2,
  slidesToScroll: 1,
  responsive: [
    {
      breakpoint: 1024, // Tablet and smaller
      settings: {
        slidesToShow: 2,
        slidesToScroll: 1,
      },
    },
    {
      breakpoint: 768, // Mobile
      settings: {
        slidesToShow: 2,
        slidesToScroll: 1,
      },
    },
  ],
};

const Presence = () => {
  const [listData, setListData] = useState([]);
  const { user_id, user_name, roles } = useSelector((state) => state.auth.data);
  const [periode, setPeriode] = useState([]);
  const { width, breakpoints } = useWidth();
  // const { setValue } = useForm();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOld, setIsOld] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(
    localStorage.getItem("presenceSelected") || 0
  );
  const dispatch = useDispatch();
  useScrollRestoration();

  const pelatihtelat = [
    "a708624f-37a9-4999-94bd-5f842bd765c4",
    "9c46b123-40d8-41e6-8f8c-391692a2bef2",
  ];

  const validationSchema = yup.object({
    trainer: yup.string().required("Coach is required"),
    periode: yup.string().required("Periode is required"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

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
      dispatch(setLoading(true));
      let res = await getPresenceById(user_id);

      // setListData(res.data.data);
      splitPerDay(res.data.data);

      const periodeResults = await getPeriodisasiToday();
      setPeriode(periodeResults.data.results[0]);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const splitPerDay = (orders) => {
    if (!Array.isArray(orders)) {
      setTabHari(daysOfWeek.map((hari) => ({ hari, data: [] })));
      return;
    }

    const updatedTabHari = daysOfWeek.map((hari) => {
      // Ambil semua details dari orders yang day-nya sama dengan hari
      const dataPerHari = orders.flatMap((order) => {
        if (order.day === hari && Array.isArray(order.details)) {
          // Bisa map details dan tambahkan info order jika perlu
          return order.details.map((detail) => ({
            ...detail,
            order_id: order.order_id,
            trainer_fullname: order.trainer_fullname,
            pool_name: order.pool_name,
            order_date: order.order_date,
            product: order.product,
            day: order.day,
            time: order.time,
          }));
        }
        return [];
      });

      return {
        hari,
        data: dataPerHari,
      };
    });
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

  const handleHadir = async (order_detail_id) => {
    const updatedItem = tabHari
      .flatMap((tab) => tab.data)
      .find((item) => item.order_detail_id === order_detail_id);

    if (updatedItem && (!updatedItem.real_date || !updatedItem.real_time)) {
      if (!updatedItem.real_date || !updatedItem.real_time) {
        await Swal.fire({
          title: "Oops!",
          text: "Silahkan isi tanggal atau jam kehadiran.",
          icon: "error",
          confirmButtonText: "OK",
        });
        return;
      }
    }

    if (updatedItem) {
      await handleUpdate(order_detail_id, updatedItem);
    }
  };

  const handleChangeDay = async (id, date) => {
    if (!date) {
      console.error("Invalid date:", date);
      return;
    }

    const formattedDate = DateTime.fromJSDate(date).toFormat("yyyy-MM-dd");

    // Update both the form value and the state synchronously
    setValue("real_date", formattedDate);
    setTabHari((prevTabHari) =>
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
    if (!time || time === "0") return;

    // Update both the form value and the state synchronously
    setValue("real_time", time);
    setTabHari((prevTabHari) =>
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

  const StudentCardold = ({ studentsInfo }) => {
    return (
      <Disclosure as="div">
        <Disclosure.Button className="group flex items-center justify-between bg-zinc-500 p-2  my-2 rounded">
          <button className="text-sm/6 font-medium text-white group-data-[hover]:text-black-50/80">
            Kontak Siswa
          </button>
          <Icon
            icon="heroicons-outline:chevron-top"
            color={"white"}
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

  const StudentCard = ({ studentsInfo }) => {
    // Ambil siswa unik berdasarkan id
    const uniqueStudents = Array.from(
      new Map(studentsInfo.map((s) => [s.id, s])).values()
    );

    return (
      <Disclosure as="div" className="my-2">
        <Disclosure.Button className="group flex items-center justify-between bg-zinc-500 p-2 rounded">
          <span className="text-sm/6 font-medium text-white group-hover:text-black-50/80">
            Kontak Siswa
          </span>
          <Icon
            icon="heroicons-outline:chevron-top"
            color="white"
            className="size-5 fill-white/60 group-hover:fill-white/50 group-open:rotate-180 transition-transform"
          />
        </Disclosure.Button>

        <Disclosure.Panel className="text-gray-500">
          {uniqueStudents.length === 0 ? (
            <div className="py-2 text-sm text-center">Belum ada siswa</div>
          ) : (
            uniqueStudents.map((student) => (
              <div
                key={student.id}
                className="grid grid-cols-2 gap-2 items-center border-b-2 py-2"
              >
                <div>{convertToTitleCase(student.fullname)}</div>
                <div className="flex justify-center items-center">
                  {student.phone ? (
                    <Button
                      variant="contained"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-success btn-sm"
                      link={getWhatsAppLink(student.phone, student.fullname)}
                    >
                      Chat WA
                    </Button>
                  ) : (
                    <Button className="opacity-40 cursor-not-allowed btn-secondary btn-sm">
                      X
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </Disclosure.Panel>
      </Disclosure>
    );
  };

  const onSubmit = async (formData) => {
    console.log(formData);
    const updatedItem = tabHari
      .flatMap((tab) => tab.data)
      .find((item) => item.order_detail_id === order_detail_id)
      .map((item) => {
        item.real_date = formData.real_date;
        item.real_time = formData.real_time;
        return item;
      });
  };

  const updateProgresSiswa = (orderId, detailId, newValue) => {
    setTabHari((prev) =>
      prev.map((tab) => ({
        ...tab,
        data: tab.data.map((order) => {
          if (order.order_id !== orderId) return order;
          return {
            ...order,
            details: order.details.map((detail) =>
              detail.order_detail_id === detailId
                ? { ...detail, progres_siswa: newValue }
                : detail
            ),
          };
        }),
      }))
    );
  };

  const PresenceViewOld = ({ item, k }) => (
    <Card
      key={`${item.order}-${k}`}
      title={`Pertemuan ke ${item.meet}`}
      subtitle={`${item.day} - ${item.time}`}
    >
      <div className="flex flex-col w-full">
        <label className="form-label" htmlFor="real_date">
          Tanggal Kehadiran
        </label>
        {/* {user_id === "a708624f-37a9-4999-94bd-5f842bd765c4" ||
        user_id === "9c46b123-40d8-41e6-8f8c-391692a2bef2" ? (
          <Flatpickr
            id="real_date"
            name="real_date"
            value={item.real_date}
            defaultValue={DateTime.now().toFormat("yyyy-MM-dd")}
            options={{
              // absen coach sering telat
              minDate: DateTime.fromFormat("2025-05-21", "yyyy-MM-dd").toFormat(
                "yyyy-MM-dd"
              ),
              maxDate: DateTime.fromFormat("2025-06-20", "yyyy-MM-dd").toFormat(
                "yyyy-MM-dd"
              ),
              // absen normal
              // minDate: DateTime.fromISO(periode.start_date).toISODate(),
              // maxDate: DateTime.fromISO(periode.end_date)
              //   .plus({ days: -1 })
              //   .toISODate(),
              disableMobile: true,
              allowInput: true,
              altInput: true,
              altFormat: "d F Y",
            }}
            register={register}
            className="form-control py-2 w-full"
            onChange={(selectedDate) =>
              handleChangeDay(item.order_detail_id, selectedDate?.[0])
            }
          />
        ) : ( */}
        <Flatpickr
          id="real_date"
          name="real_date"
          value={item.real_date}
          defaultValue={DateTime.now().toFormat("yyyy-MM-dd")}
          options={{
            // absen coach sering telat
            // minDate: DateTime.fromFormat("2025-04-21", "yyyy-MM-dd").toFormat(
            //   "yyyy-MM-dd"
            // ),
            // maxDate: DateTime.fromFormat("2025-05-20", "yyyy-MM-dd").toFormat(
            //   "yyyy-MM-dd"
            // ),
            // absen normal
            minDate: DateTime.fromISO(periode.start_date).toISODate(),
            maxDate: DateTime.fromISO(periode.end_date)
              .plus({ days: -1 })
              .toISODate(),
            disableMobile: true,
            allowInput: true,
            altInput: true,
            altFormat: "d F Y",
          }}
          register={register}
          className="form-control py-2 w-full"
          onChange={(selectedDate) =>
            handleChangeDay(item.order_detail_id, selectedDate?.[0])
          }
        />
        {/* )} */}
        <div className="flex flex-col w-full">
          <label className="form-label mt-2" htmlFor="real_time">
            Jam kehadiran
          </label>
          <select
            name="real_time"
            value={item.real_time}
            onChange={(e) =>
              handleChangeTime(item.order_detail_id, e.target.value)
            }
            className="form-select w-full"
            register={register}
          >
            {jam.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <footer className="flex flex-row justify-end mt-4">
        <button
          className="btn-success p-2 rounded text-md w-24"
          type="button"
          onClick={() => handleHadir(item.order_detail_id)}
        >
          Hadir
        </button>
      </footer>
      {/* </form> */}
    </Card>
  );

  const PresenceView = ({ item }) => {
    console.log(item);
    return (
      <div className="flex flex-col border p-2 rounded-md bg-slate-50 dark:bg-slate-700">
        <div className="font-medium">{item.student.fullname}</div>
        <div className="text-sm mb-1">Pertemuan ke-{item.meet}</div>
        <input
          type="text"
          value={item.progres_siswa || ""}
          placeholder="Masukkan progres"
          className="border p-1 rounded w-full text-sm"
          onChange={(e) =>
            updateProgresSiswa(
              item.order_id,
              item.order_detail_id,
              e.target.value
            )
          }
        />
      </div>
    );
  };

  const groupDataByDayAndOrder = (flatData) => {
    // group per hari
    const tabHari = daysOfWeek.map((hari) => {
      const dayData = flatData.filter((item) => item.day === hari);

      // group per order_id
      const orders = Object.values(
        dayData.reduce((acc, item) => {
          if (!acc[item.order_id]) {
            acc[item.order_id] = {
              order_id: item.order_id,
              trainer_fullname: item.trainer_fullname,
              pool_name: item.pool_name,
              order_date: item.order_date,
              expire_date: item.expire_date,
              product: item.product,
              day: item.day,
              time: item.time,
              details: [],
            };
          }
          acc[item.order_id].details.push(item);
          return acc;
        }, {})
      );

      // Sort details per order per meet & student
      orders.forEach((order) => {
        order.details = order.details
          .slice() // clone array
          .sort(
            (a, b) =>
              Number(a.meet) - Number(b.meet) ||
              a.student.fullname.localeCompare(b.student.fullname)
          );
      });

      return {
        hari,
        orders,
      };
    });

    return tabHari;
  };

  const DisplayData = (data) => {
    // old
    // const groupedData = data.reduce((acc, item) => {
    //   const studentNames = item.students_info
    //     .map((s) => convertToTitleCase(s.fullname))
    //     .join(", ");
    //   if (!acc[item.order]) acc[item.order] = {};
    //   if (!acc[item.order][studentNames]) acc[item.order][studentNames] = [];
    //   acc[item.order][studentNames].push(item);
    //   return acc;
    // }, {});

    if (!Array.isArray(data) || data.length === 0) return <DataNotFound />;

    // Grouping: order_id -> studentNames -> array of details
    // const groupedData = data.reduce((acc, item) => {
    //   const studentNames = item.students_info
    //     .map((s) => convertToTitleCase(s.fullname))
    //     .join(", ");

    //   if (!acc[item.order_id]) acc[item.order_id] = {};
    //   if (!acc[item.order_id][studentNames])
    //     acc[item.order_id][studentNames] = [];

    //   acc[item.order_id][studentNames].push(item);
    //   return acc;
    // }, {});

    return (
      <>
        <Search
          handleSearch={(query) => handleSearch(query)}
          searchValue={searchQuery} // Bind searchQuery as the value
          placeholder={`Cari siswa hari ${hari[selectedIndex].value}`}
        />

        <div className="grid grid-cols-1 justify-end gap-5 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1 lg:gap-5">
          {/* {Object.keys(groupedData).map((order_id, i) => (
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
                  DateTime.fromFormat(
                    groupedData[order_id][student_name]?.[j]?.order_date,
                    "yyyy-MM-dd"
                  )
                    .plus({ days: 120 })
                    .toFormat("dd MMMM yyyy");
                const hari =
                  groupedData[order_id][student_name]?.[j]?.day || "";
                const product =
                  groupedData[order_id][student_name]?.[j]?.product || "";
                return (
                  <Card
                    title={student_name.replace(",", ", ")}
                    subtitle={
                      <>
                        <div className="text-sm flex- flex-col gap-2">
                           <div> Hari : {hari} </div> 
                          <div>
                            Tanggal Order :{" "}
                            {DateTime.fromFormat(
                              order_date,
                              "yyyy-MM-dd"
                            ).toFormat("dd MMMM yyyy")}
                          </div>
                          <div>Tanggal Kadaluarsa : {expire_date} </div>
                          <div>Kolam : {poolName}</div>
                        </div>
                      </>
                    }
                    titleClass="text-sm align-top"
                    key={i + j}
                    bodyClass="p-4 overflow-x-auto"
                  >
                    <div className="flex flex-row gap-4">
                      {width >= breakpoints.md &&
                        groupedData[order_id][student_name]
                          .sort((a, b) => a.meet - b.meet)
                          .map((item, k) => (
                            <PresenceView item={item} k={i + j + k} />
                          ))}
                      {width <= breakpoints.md && (
                        <div className="flex flex-nowrap gap-4 shrink-0 py-2 min-w-full">
                          {groupedData[order_id][student_name]
                            .sort((a, b) => a.meet - b.meet)
                            .map((item, k) => (
                              <PresenceView item={item} k={i + j + k} />
                            ))}
                        </div>
                      )}
                    </div>
                    <footer className="flex flex-row justify-start mt-4">
                      <StudentCard
                        studentsInfo={
                          groupedData[order_id][student_name]?.[j]
                            ?.students_info || []
                        }
                      />
                    </footer>
                  </Card>
                );
              })}
            </div>
          ))} */}
          {data.map((order, idxOrder) => (
            <Card
              key={order.order_id}
              title={`${order.product} - ${order.trainer_fullname}`}
              subtitle={
                <div className="text-sm flex flex-col gap-2">
                  <div>
                    Tanggal Order :{" "}
                    {DateTime.fromFormat(
                      order.order_date,
                      "yyyy-MM-dd"
                    ).toFormat("dd MMMM yyyy")}
                  </div>
                  <div>
                    Tanggal Kadaluarsa :{" "}
                    {order.expire_date
                      ? order.expire_date
                      : DateTime.fromFormat(order.order_date, "yyyy-MM-dd")
                          .plus({ days: 120 })
                          .toFormat("dd MMMM yyyy")}
                  </div>
                  <div>Kolam : {order.pool_name}</div>
                  <div>Hari : {order.day}</div>
                  <div>Jam : {order.time}</div>
                </div>
              }
              titleClass="text-sm align-top"
              bodyClass="p-4 overflow-x-auto"
            >
              <div className="flex flex-row gap-4">
                {(order.details || [])
                  .slice()
                  .sort(
                    (a, b) =>
                      a.meet - b.meet ||
                      a.student.fullname.localeCompare(b.student.fullname)
                  )
                  .map((detail) => (
                    <PresenceView key={detail.order_detail_id} item={detail} />
                  ))}
              </div>
              <footer className="flex flex-row justify-start mt-4">
                <StudentCard
                  studentsInfo={Array.from(
                    new Map(
                      order.details.map((d) => [d.student.id, d.student])
                    ).values()
                  )}
                />
              </footer>
            </Card>
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
        <Tab.List className="flex-nowrap overflow-x-auto whitespace-nowrap flex gap-3 my-4 pb-2">
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
                      <div className="grid auto-cols-max grid-flow-col">
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
                          // <Slider {...sliderSettings} key={j}>
                          //   {groupedData[order_id][student_name]
                          //     .sort((a, b) => a.meet - b.meet)
                          //     .map((item, k) => (
                          //       <PresenceView item={item} k={i + j + k} />
                          //     ))}
                          // </Slider>
                          <div className="flex flex-nowrap">
                            {groupedData[order_id][student_name]
                              .sort((a, b) => a.meet - b.meet)
                              .map((item, k) => (
                                <PresenceView item={item} k={i + j + k} />
                              ))}
                          </div>
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
