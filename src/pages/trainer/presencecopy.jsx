import React, { useEffect, useReducer, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import { getPresenceById } from "@/axios/trainer/presence";
import Button from "@/components/ui/Button";
import Swal from "sweetalert2";
import { UpdatePresenceById } from "@/axios/trainer/presence";
import Flatpickr from "react-flatpickr";
import { DateTime } from "luxon";
import { getPeriodisasiToday } from "@/axios/referensi/periodisasi";
import useWidth from "@/hooks/useWidth";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { hari, jam } from "@/constant/jadwal-default";
import Search from "@/components/globals/table/search";
import { startCase, toLower } from "lodash";

import Notfound from "@/assets/images/svg/notfound.svg";
import { Disclosure, Tab } from "@headlessui/react";
import Icon from "@/components/ui/Icon";
import { setLoading } from "@/redux/slicers/loadingSlice";
import useScrollRestoration from "@/hooks/useScrollRestoration";
import { useAuthStore } from "@/redux/slicers/authSlice";
import Badge from "@/components/ui/Badge";
import Tooltip from "@/components/ui/Tooltip";
import Icons from "@/components/ui/Icon";

const MIN_PROGRESS_LENGTH = 20;

const sliderSettings = {
  dots: true,
  infinite: false,
  speed: 500,
  slidesToShow: 2,
  slidesToScroll: 1,
  responsive: [
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 1,
      },
    },
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 1,
      },
    },
  ],
};

const PresenceCopy = () => {
  const [listData, setListData] = useState([]);
  const { user_id, username, roles } = useAuthStore((state) => state.data);
  const [periode, setPeriode] = useState([]);
  const { width, breakpoints } = useWidth();

  const [searchQuery, setSearchQuery] = useState("");
  const [isOld, setIsOld] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(
    localStorage.getItem("presenceSelected") || 0
  );
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
  const draftProgressRef = useRef(new Map());

  const getDraftKey = (orderDetailId, studentId) =>
    `${orderDetailId}:${studentId}`;

  const getDraftProgress = (orderDetailId, studentId) =>
    draftProgressRef.current.get(getDraftKey(orderDetailId, studentId));

  const setDraftProgress = (orderDetailId, studentId, value) => {
    draftProgressRef.current.set(getDraftKey(orderDetailId, studentId), value);
  };

  const clearDraftProgress = (orderDetailId, studentId = null) => {
    const prefix = `${orderDetailId}:`;
    if (studentId === null) {
      Array.from(draftProgressRef.current.keys()).forEach((key) => {
        if (key.startsWith(prefix)) draftProgressRef.current.delete(key);
      });
      return;
    }
    draftProgressRef.current.delete(getDraftKey(orderDetailId, studentId));
  };

  const commitDraftProgress = (orderDetailId, studentId = null) => {
    const entries = Array.from(draftProgressRef.current.entries()).filter(
      ([key]) => {
        if (!key.startsWith(`${orderDetailId}:`)) return false;
        if (studentId === null) return true;
        return key === getDraftKey(orderDetailId, studentId);
      }
    );

    if (!entries.length) return;

    const draftMap = new Map(
      entries.map(([key, value]) => [key.split(":")[1], value])
    );

    setTabHari((prevTabHari) =>
      prevTabHari.map((tab) => ({
        ...tab,
        data: tab.data.map((item) => {
          if (item.order_detail_id !== orderDetailId) return item;

          const studentsInfo = Array.isArray(item.students_info)
            ? item.students_info
            : [];

          const updatedStudents = studentsInfo.map((student, index) => {
            const studentId =
              student?.student_id ??
              student?.id ??
              student?.studentId ??
              student?.student?.id ??
              index;
            const draftValue = draftMap.has(String(studentId))
              ? draftMap.get(String(studentId))
              : undefined;
            if (draftValue === undefined) return student;
            return {
              ...student,
              progres: draftValue,
              ...(student?.progres_siswa !== undefined && {
                progres_siswa: draftValue,
              }),
            };
          });

          return {
            ...item,
            students_info: updatedStudents,
          };
        }),
      }))
    );

    if (studentId === null) {
      clearDraftProgress(orderDetailId);
    } else {
      clearDraftProgress(orderDetailId, studentId);
    }
  };

  useEffect(() => {
    if (tabHari.length && tabHari[selectedIndex]?.data) {
      setListData(tabHari[selectedIndex].data);
    }
    localStorage.setItem("presenceSelected", selectedIndex);
  }, [selectedIndex, tabHari]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let res = await getPresenceById(user_id);

      splitPerDay(res.data.data);

      const periodeResults = await getPeriodisasiToday();
      setPeriode(periodeResults.data.results[0]);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      draftProgressRef.current.clear();
      setLoading(false);
    }
  };

  const splitPerDay = (data) => {
    const updatedTabHari = daysOfWeek.map((hari) => ({
      hari,
      data: data.filter((item) => item.day === hari),
    }));
    setTabHari(updatedTabHari);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);

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
      fetchData();
    }
  };

  const normalizeProgress = (value) =>
    typeof value === "string" ? value.trim() : "";

  const countWords = (value) =>
    normalizeProgress(value).split(/\s+/).filter(Boolean).length;

  const hasExcessiveRepeats = (value) =>
    /(.)\1{3,}/.test(normalizeProgress(value).replace(/\s+/g, ""));

  const hasEnoughUniqueCharacters = (value) => {
    const cleaned = normalizeProgress(value).replace(/\s+/g, "").toLowerCase();
    return new Set(cleaned).size >= 5;
  };

  const isProgressValid = (value) => {
    const trimmed = normalizeProgress(value);
    if (trimmed.length < MIN_PROGRESS_LENGTH) return false;
    if (countWords(trimmed) < 3) return false;
    if (!/[a-zA-Z]/.test(trimmed)) return false;
    if (!/[aiueoAIUEO]/.test(trimmed)) return false;
    if (/^\d+$/.test(trimmed)) return false;
    if (hasExcessiveRepeats(trimmed)) return false;
    if (!hasEnoughUniqueCharacters(trimmed)) return false;
    return true;
  };

  const getStudentsMissingProgress = (students = []) =>
    Array.isArray(students)
      ? students.filter(
          (student) => !isProgressValid(getProgressValue(student))
        )
      : [];

  const getProgressValue = (student = {}) => {
    if (typeof student?.progres === "string") return student.progres;
    if (typeof student?.progres_siswa === "string")
      return student.progres_siswa;
    return "";
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

    const hasLessThanThreshold = tabHari
      .flatMap((tab) => tab.data)
      .some((item) => item.order_id === order_id && item.meet < threshold);

    return !hasLessThanThreshold;
  };

  const handleUpdate = async (order_id, updatedData) => {
    try {
      const missingProgress = getStudentsMissingProgress(
        updatedData?.students_info
      );

      if (missingProgress.length) {
        await Swal.fire({
          title: "Oops!",
          html: `
            <div class="text-left">
              <p class="mb-2">Lengkapi progres minimal ${MIN_PROGRESS_LENGTH} karakter untuk siswa berikut:</p>
              <ul class="list-disc list-inside">
                ${missingProgress
                  .map((student) => {
                    const progress = normalizeProgress(
                      getProgressValue(student)
                    );
                    const words = countWords(progress);
                    return `<li>${student.fullname || "-"} (${
                      progress.length
                    }/${MIN_PROGRESS_LENGTH} karakter, ${words} kata)</li>`;
                  })
                  .join("")}
              </ul>
            </div>
          `,
          icon: "error",
          confirmButtonText: "OK",
        });
        return;
      }

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
            .map((item) => {
              const progress = normalizeProgress(getProgressValue(item));
              const words = countWords(progress);
              return `${item.fullname} (${
                progress.length || 0
              }/${MIN_PROGRESS_LENGTH} karakter, ${words} kata)`;
            })
            .join("<br />")}<br />
          <strong>Pertemuan ke:</strong> ${updatedData.meet}<br />
          <strong>Tanggal:</strong> ${updatedData.real_date}<br />
          </div>
          `,
        // <strong>Jam:</strong> ${updatedData.real_time}
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

      // 🔥 Generate params untuk tiap siswa
      const params = updatedData.students_info.map((student, index) => {
        const studentId =
          student?.student_id ??
          student?.id ??
          student?.studentId ??
          student?.student?.id ??
          index;
        return {
          order: updatedData.order_id,
          meet: updatedData.meet,
          is_presence: true,
          real_date: updatedData.real_date,
          real_time: updatedData.time,
          presence_day: DateTime.now().toFormat("yyyy-MM-dd"),
          student_id: studentId,
          progres: normalizeProgress(getProgressValue(student)),
        };
      });

      const updateRes = await UpdatePresenceById(order_id, params);
      if (!updateRes) throw new Error("Failed to update presence");

      await Swal.fire({
        title: "Absensi Berhasil",
        text: `Total siswa: ${updatedData.students_info.length}`,
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
    commitDraftProgress(order_detail_id);
    const updatedItem = tabHari
      .flatMap((tab) => tab.data)
      .find((item) => item.order_detail_id === order_detail_id);

    if (updatedItem && !updatedItem.real_date /* || !updatedItem.real_time*/) {
      if (!updatedItem.real_date /* || !updatedItem.real_time*/) {
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

  const getWhatsAppLink = (phone, name) => {
    const countryCode = "+62";
    return `https://wa.me/${countryCode}${phone}/?text=hi, ${name}`;
  };

  const parseMutasiStatus = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "ya", "yes", "mutasi"].includes(normalized))
        return true;
      if (["false", "0", "tidak", "no", "reguler"].includes(normalized))
        return false;
    }
    return false;
  };

  const normalizeName = (value) =>
    typeof value === "string" ? value.trim().toLowerCase() : "";

  const pickNameSource = (values = [], exclude = []) => {
    const excludes = Array.isArray(exclude) ? exclude : [exclude];
    const excludeSet = new Set(
      excludes.map((item) => normalizeName(item)).filter(Boolean)
    );

    for (const value of values) {
      if (typeof value !== "string") continue;
      const trimmed = value.trim();
      if (!trimmed) continue;
      const normalized = trimmed.toLowerCase();
      if (excludeSet.has(normalized)) continue;
      return trimmed;
    }

    return "";
  };

  const StudentCard = ({ studentsInfo }) => {
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

    console.log(updatedItem);
  };

  const PresenceView = ({ item, k }) => {
    const [, forceDraftRecalc] = useReducer((x) => x + 1, 0);
    const students = Array.isArray(item.students_info)
      ? item.students_info
      : [];
    const progressCompleted = students.every((student, index) => {
      const studentId =
        student?.student_id ??
        student?.id ??
        student?.studentId ??
        student?.student?.id ??
        index;
      const draftValue = getDraftProgress(item.order_detail_id, studentId);
      const progress = draftValue ?? getProgressValue(student);
      return isProgressValid(progress);
    });

    return (
      <Card
        key={
          item?.order_detail_id
            ? `${item.order_detail_id}`
            : item?.order_id
            ? `${item.order_id}-${item.meet}`
            : `${k}`
        }
        title={`Pertemuan ke ${item.meet}`}
        subtitle={`${item.day} - ${item.time}`}
      >
        <div className="flex flex-col w-full">
          <label className="form-label" htmlFor="real_date">
            Tanggal Kehadiran
          </label>

          <Flatpickr
            id="real_date"
            name="real_date"
            value={item.real_date}
            defaultValue={DateTime.now().toFormat("yyyy-MM-dd")}
            options={{
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

          {/* jam dikomen dulu */}
          {/*
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
           */}
          <div className="flex flex-col w-full">
            <label className="form-label mt-2" htmlFor="real_time">
              Progres Siswa
            </label>
            {item.students_info.map((student, index) => {
              const studentId =
                student?.student_id ??
                student?.id ??
                student?.studentId ??
                student?.student?.id ??
                index;
              return (
                <StudentProgressInput
                  key={`${item.order_detail_id}-${studentId}`}
                  student={student}
                  item={item}
                  studentId={studentId}
                  setDraftProgress={setDraftProgress}
                  commitDraftProgress={commitDraftProgress}
                  getDraftProgress={getDraftProgress}
                  notifyDraftChange={forceDraftRecalc}
                />
              );
            })}
          </div>
        </div>
        <footer className="flex flex-row justify-end mt-4">
          <button
            className={`btn-success p-2 rounded text-md w-24 ${
              !progressCompleted ? "opacity-60 cursor-not-allowed" : ""
            }`}
            type="button"
            onClick={() => handleHadir(item.order_detail_id)}
            disabled={!progressCompleted}
          >
            Hadir
          </button>
        </footer>
        {/* </form> */}
      </Card>
    );
  };

  const StudentProgressInput = ({
    student,
    studentId,
    item,
    setDraftProgress,
    commitDraftProgress,
    getDraftProgress,
    notifyDraftChange,
  }) => {
    const [localValue, setLocalValue] = useState(
      getDraftProgress(item.order_detail_id, studentId) ||
        getProgressValue(student)
    );

    useEffect(() => {
      const draft = getDraftProgress(item.order_detail_id, studentId);
      const progress = draft ?? getProgressValue(student);
      setLocalValue((prev) => (prev === progress ? prev : progress));
    }, [
      student.progres,
      student.progres_siswa,
      studentId,
      item.order_detail_id,
    ]);

    const trimmedLength = normalizeProgress(localValue).length;
    const wordCount = countWords(localValue);
    const isMeaningful = isProgressValid(localValue);

    return (
      <div className="flex flex-col mb-2">
        <span className="text-sm font-semibold">{student.fullname}</span>
        <textarea
          className="form-control w-full"
          value={localValue}
          maxLength={100}
          minLength={MIN_PROGRESS_LENGTH}
          required
          onChange={(e) => {
            const { value } = e.target;
            setLocalValue(value);
            setDraftProgress(item.order_detail_id, studentId, value);
            notifyDraftChange();
          }}
          onBlur={() => {
            commitDraftProgress(item.order_detail_id, studentId);
            notifyDraftChange();
          }}
        />
        <div className="text-xs text-gray-500 mt-1">
          {trimmedLength}/100 karakter • {wordCount} kata
          {!isMeaningful && (
            <span className="text-red-500 ml-1">
              (Minimal {MIN_PROGRESS_LENGTH} karakter, 3 kata, tidak boleh
              karakter acak)
            </span>
          )}
        </div>
      </div>
    );
  };

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

    return (
      <>
        <Search
          handleSearch={(query) => handleSearch(query)}
          searchValue={searchQuery}
          placeholder={`Cari siswa hari ${hari[selectedIndex].value}`}
        />

        <div className="grid grid-cols-1 justify-end gap-5 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1 lg:gap-5">
          {Object.keys(groupedData).map((order_id, i) => (
            <div key={i}>
              {Object.keys(groupedData[order_id]).map((student_name, j) => {
                const currentItem =
                  groupedData[order_id][student_name]?.[j] || {};
                const poolName = currentItem?.pool_name || "Pool not specified";
                const order_date = currentItem?.order_date || "";
                const expire_date =
                  currentItem?.expire_date ||
                  DateTime.fromFormat(order_date, "yyyy-MM-dd")
                    .plus({ days: 120 })
                    .toFormat("dd MMMM yyyy");
                const hari = currentItem?.day || "";
                const product = currentItem?.product || "";
                const studentsInfo = Array.isArray(currentItem?.students_info)
                  ? currentItem.students_info
                  : [];
                const primaryStudent = studentsInfo[0] || {};
                const mutasiSource =
                  currentItem?.is_mutasi ?? primaryStudent?.is_mutasi;
                const isMutasi = parseMutasiStatus(mutasiSource);

                const previousTrainerSource = pickNameSource([
                  currentItem?.previous_trainer_nickname,
                  primaryStudent?.previous_trainer_nickname,
                  currentItem?.previous_trainer_name,
                  primaryStudent?.previous_trainer_name,
                  currentItem?.previous_trainer_fullname,
                  primaryStudent?.previous_trainer_fullname,
                ]);
                const previousTrainerName = previousTrainerSource
                  ? convertToTitleCase(previousTrainerSource)
                  : "";
                const previousTrainerNormalized =
                  normalizeName(previousTrainerSource);

                const assignedTrainerSource = pickNameSource(
                  [
                    currentItem?.trainer_nickname,
                    currentItem?.current_trainer_nickname,
                    primaryStudent?.current_trainer_nickname,
                    primaryStudent?.trainer_nickname,
                    currentItem?.trainer_fullname,
                    currentItem?.trainer_name,
                    currentItem?.current_trainer_fullname,
                    currentItem?.current_trainer_name,
                    primaryStudent?.current_trainer_fullname,
                    primaryStudent?.trainer_fullname,
                    primaryStudent?.trainer_name,
                  ],
                  previousTrainerSource
                );
                const assignedTrainerNormalized =
                  normalizeName(assignedTrainerSource);

                const mutatedTrainerSource = pickNameSource(
                  [
                    currentItem?.mutated_trainer_nickname,
                    currentItem?.mutasi_trainer_nickname,
                    currentItem?.mutasi_to_trainer_nickname,
                    currentItem?.change_trainer_nickname,
                    currentItem?.new_trainer_nickname,
                    primaryStudent?.mutated_trainer_nickname,
                    primaryStudent?.mutasi_trainer_nickname,
                    primaryStudent?.mutasi_to_trainer_nickname,
                    currentItem?.mutated_trainer_fullname,
                    currentItem?.mutasi_trainer_fullname,
                    currentItem?.mutasi_to_trainer_fullname,
                    currentItem?.change_trainer_fullname,
                    currentItem?.new_trainer_fullname,
                    currentItem?.trainer_mutation_fullname,
                    currentItem?.mutated_trainer_name,
                    currentItem?.mutasi_trainer_name,
                    currentItem?.mutasi_to_trainer_name,
                    currentItem?.change_trainer_name,
                    currentItem?.new_trainer_name,
                    primaryStudent?.mutated_trainer_fullname,
                    primaryStudent?.mutasi_trainer_fullname,
                    primaryStudent?.mutasi_to_trainer_fullname,
                    primaryStudent?.mutated_trainer_name,
                    primaryStudent?.mutasi_trainer_name,
                    primaryStudent?.mutasi_to_trainer_name,
                  ],
                  [previousTrainerSource, assignedTrainerSource].filter(Boolean)
                );

                const showMutasiFrom = previousTrainerName;
                const showMutasiToSource =
                  mutatedTrainerSource ||
                  (assignedTrainerNormalized &&
                  assignedTrainerNormalized !== previousTrainerNormalized
                    ? assignedTrainerSource
                    : "");
                const showMutasiTo = showMutasiToSource
                  ? convertToTitleCase(showMutasiToSource)
                  : "";

                return (
                  <Card
                    title={student_name.replace(",", ", ")}
                    subtitle={
                      <>
                        <div className="text-sm flex- flex-col gap-2">
                          {/* <div> Hari : {hari} </div> */}
                          <div>
                            Tanggal Order :{" "}
                            {DateTime.fromFormat(
                              order_date,
                              "yyyy-MM-dd"
                            ).toFormat("dd MMMM yyyy")}
                          </div>
                          <div>Tanggal Kadaluarsa : {expire_date} </div>
                          <div>Kolam : {poolName}</div>
                          {/* <div>{student_name.replace(",", ", ")}</div> */}
                        </div>
                      </>
                    }
                    titleClass="text-sm align-top"
                    key={i + j}
                    bodyClass="p-4 overflow-x-auto"
                    headerslot={
                      <div className="flex items-center gap-3">
                        <Tooltip
                          placement="top"
                          arrow
                          content={"Sudah bisa dicairkan 🥳🥳🥳"}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <Icons
                              icon="heroicons-outline:currency-dollar"
                              className="h-8 w-8 text-green-700"
                            />
                            <span className="text-green-700">Settled</span>
                          </div>
                        </Tooltip>
                        {isMutasi && (showMutasiFrom || showMutasiTo) && (
                          <div className="flex flex-col items-center gap-1 text-xs text-slate-600">
                            <Badge
                              label="Mutasi"
                              className="bg-amber-500 text-white text-[11px]"
                            />
                            <div className="flex items-center gap-1 font-medium text-slate-600">
                              <span className="text-center">
                                {showMutasiFrom || "-"}
                              </span>
                              {showMutasiFrom && showMutasiTo && (
                                <Icons
                                  icon="heroicons-outline:arrow-right"
                                  className="h-4 w-4 text-slate-400"
                                />
                              )}
                              {showMutasiTo && (
                                <span className="text-center">
                                  {showMutasiTo}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] uppercase tracking-wide text-slate-400">
                              {showMutasiFrom && showMutasiTo
                                ? "Perpindahan Pelatih"
                                : showMutasiFrom
                                ? "Mutasi Dari"
                                : "Mutasi Ke"}
                            </span>
                          </div>
                        )}
                      </div>
                    }
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
      <TabbedVersion />
    </>
  );
};

export default PresenceCopy;
