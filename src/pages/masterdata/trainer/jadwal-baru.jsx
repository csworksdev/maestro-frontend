// src/components/Jadwal.js
import { getKolamAll } from "@/axios/referensi/kolam";
import Loading from "@/components/Loading";
import Card from "@/components/ui/Card";
import React, { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import {
  AddTrainerSchedule,
  getTrainerScheduleByTrainer,
  DeleteTrainerSchedule,
} from "@/axios/masterdata/trainerSchedule";
import {
  baseJadwal,
  mockDataJadwal,
  initDay,
  initTime,
} from "@/constant/jadwal-default";
import Swal from "sweetalert2";
import AsyncSelect from "react-select/async";
import Badge from "@/components/ui/Badge";
import {
  AddTrainerScheduleNew,
  EditTrainerScheduleNew,
  getTrainerScheduleByTrainerNew,
} from "@/axios/masterdata/trainerScheduleNew";
import {
  AddTrainerPool,
  DeleteTrainerPool,
  GetTrainerPool,
} from "@/axios/schedule/trainerPool";
import {
  AddTrainerScheduleV2,
  EditTrainerScheduleV2,
  GetTrainerScheduleV2,
} from "@/axios/schedule/trainerSchedule";

// Validation schema
const FormValidationSchema = yup.object({}).required();

export const getResponseList = (response) => {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const sortPools = (pools = []) =>
  [...pools].sort((a, b) => {
    const branchComparison = String(a?.branch_name ?? "").localeCompare(
      String(b?.branch_name ?? ""),
    );
    return (
      branchComparison ||
      String(a?.name ?? "").localeCompare(String(b?.name ?? ""))
    );
  });

const createInitialSchedule = (trainerId) =>
  mockDataJadwal.map((schedule) => ({
    ...schedule,
    trainer_id: trainerId,
    datahari: schedule.datahari.map((day) => ({
      ...day,
      data: day.data.map((time) => ({ ...time })),
    })),
  }));

const Checkbox = ({
  name,
  label,
  checked,
  onChange,
  isActive,
  badge = false,
}) => (
  <div className={"flex items-center"}>
    <input
      type="checkbox"
      key={name}
      name={name}
      id={name}
      checked={checked}
      onChange={onChange}
      className="form-checkbox"
      disabled={isActive}
    />
    <label htmlFor={name} className="ml-2">
      {label}{" "}
      {badge ? (
        !checked ? (
          <Badge
            label="Libur"
            className="bg-danger-500 text-danger-500 bg-opacity-[0.12] pill"
          />
        ) : !isActive ? (
          <Badge
            label="Masuk"
            className="bg-success-500 text-success-500 bg-opacity-[0.12] pill"
          />
        ) : (
          <Badge
            label="Ada Siswa"
            className="bg-blue-300 text-blue-400 bg-opacity-[0.12] pill"
          />
        )
      ) : null}
    </label>
  </div>
);

const CardJadwal = ({ params, onChange, onChangeAll }) => {
  return (
    <>
      {params.map((item, i) => {
        return (
          <Card
            title={item.hari}
            headerslot={
              <>
                <Checkbox
                  name={item.hari}
                  key={item.hari}
                  label={"Masuk"}
                  checked={item.data?.every((jam) => jam.is_avail) ?? false} // Prevents errors
                  onChange={() =>
                    onChangeAll(
                      item.data?.map((y) => ({
                        day: item.hari,
                        ts_id: y.ts_id,
                        is_avail: !item.data?.every((jam) => jam.is_avail),
                      }))
                    )
                  }
                />
              </>
            }
          >
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                {item.data.map((option, i) => {
                  const isChecked = option.is_avail;
                  const isActive = option.order_id !== "";
                  return (
                    <div
                      className={` p-2 rounded-lg select-none ${
                        isChecked ? "bg-white border-blue-300" : "bg-red-100"
                      }`}
                      key={i}
                    >
                      <Checkbox
                        name={`${item.hari}#${option.jam}`}
                        key={`${item.hari}#${option.jam}`}
                        label={option.jam}
                        checked={isChecked}
                        onChange={() =>
                          onChange({
                            hari: item.hari,
                            jam: option.jam,
                            ts_id: option.ts_id,
                            is_avail: !option.is_avail,
                          })
                        }
                        badge={true}
                        isActive={isActive}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        );
      })}
    </>
  );
};

const JadwalBaru = ({ data }) => {
  const [selected, setSelected] = useState([]);
  const [kolamOption, setKolamOption] = useState([]);
  const [loading, setLoading] = useState(true);
  const [oldSelectedPool, setOldSelectedPool] = useState([]);
  const [selectedPool, setSelectedPool] = useState([]);
  const [trainerPool, setTrainerPool] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for submission status
  const navigate = useNavigate();
  const [listData, setListData] = useState([]);
  const [isNewTrainer, setIsNewTrainer] = useState(false);
  const [scheduleLoadError, setScheduleLoadError] = useState("");

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "all",
  });

  const updateDataList = (jadwal) => {
    setListData((prev) =>
      prev.map((item) =>
        item.trainer_id === data.trainer_id
          ? {
              ...item,
              datahari: item.datahari.map((hari) =>
                hari.hari === jadwal.hari
                  ? {
                      ...hari,
                      data: hari.data.map((jam) =>
                        jam.jam === jadwal.jam
                          ? { ...jam, is_avail: jadwal.is_avail } // Toggle availability
                          : jam
                      ),
                    }
                  : hari
              ),
            }
          : item
      )
    );
  };

  const setInitJadwal = () => {
    const temp = [];
    initDay.forEach((hari) => {
      initTime.map((jam) => {
        temp.push({
          day: hari,
          time: jam,
          is_avail: true,
          trainer_id: data.trainer_id,
        });
      });
    });

    temp.forEach((item) => {
      AddTrainerScheduleV2(data.trainer_id, item).then((res) =>
        updateDataList({
          hari: item.day,
          jam: item.time,
          is_avail: item.is_avail,
        })
      );
    });
  };

  const mergeJadwal = (params) => {
    params.forEach((i) => {
      setListData((prev) =>
        prev.map((item) =>
          item.trainer_id === data.trainer_id
            ? {
                ...item,
                datahari: item.datahari.map((hari) =>
                  hari.hari === i.day
                    ? {
                        ...hari,
                        data: hari.data.map((jam) =>
                          jam.jam === i.time
                            ? { ...jam, is_avail: i.is_avail, ts_id: i.ts_id } // Toggle availability
                            : jam
                        ),
                      }
                    : hari
                ),
              }
            : item
        )
      );
    });
  };

  /**
   * The function `handleInitJadwal` fetches a trainer's schedule and updates the state based on the
   * response.
   */
  const handleInitJadwal = async () => {
    try {
      const trainerScheduleResponse = await GetTrainerScheduleV2(
        data.trainer_id
      );
      if (!trainerScheduleResponse) {
        throw new Error("Respons jadwal pelatih tidak tersedia.");
      }

      const schedules = getResponseList(trainerScheduleResponse);
      if (schedules.length === 0) {
        setIsNewTrainer(true);
        setInitJadwal();
      } else {
        mergeJadwal(schedules);
      }
    } catch (error) {
      console.error(error);
      setScheduleLoadError(
        "Jadwal gagal dimuat. Silakan muat ulang halaman atau coba kembali.",
      );
    }
  };

  useEffect(() => {
    const fetchPools = async () => {
      try {
        const response = await GetTrainerPool(data.trainer_id);
        const pools = getResponseList(response).map((pool) => ({
          value: pool.pool,
          label: pool.pool_name,
        }));

        setOldSelectedPool(pools);
        setSelectedPool(pools); // ✅ Set initial selected values
      } catch (error) {
        // Swal.fire("Error", "Failed to load pool options.", "error");
      }
    };

    const loadPage = async () => {
      if (!data?.trainer_id) {
        setScheduleLoadError("ID pelatih tidak tersedia.");
        setLoading(false);
        return;
      }

      setListData(createInitialSchedule(data.trainer_id));

      await Promise.allSettled([
        fetchPools(),
        loadReference(),
        getTrainerScheduleByTrainerNew(data.trainer_id),
        handleInitJadwal(),
      ]);
      setLoading(false);
    };

    loadPage();
  }, [data?.trainer_id]);

  const loadReference = async () => {
    try {
      const params = {
        page: 1,
        page_size: 200,
        is_active: true,
      };
      const kolamResponse = await getKolamAll(params).then((res) => {
        return res;
      });

      const kolamOption = sortPools(getResponseList(kolamResponse))
        .map((item) => ({
          value: item.pool_id,
          // label: item.branch_name + " - " + item.name,
          label: item.name,
        }));
      setKolamOption(kolamOption);
    } catch (error) {
      console.error(error);
    }
  };

  const onSubmit = async (newData, eventnewData) => {
    event.preventDefault();
    if (data.trainer_id !== "") {
      let response = await EditTrainerScheduleNew(data.trainer_id, listData[0]);
      if (response) {
        Swal.fire("Failed!", "Your file failed to update.", "error");
      }
    } else {
      let response = await AddTrainerScheduleNew(listData[0]);
      if (response) {
        Swal.fire("Updated!", "Your file has been updated.", "success");
      }
    }
  };

  const onSubmitPool = async (newData, event) => {
    try {
      event.preventDefault();
      setIsSubmitting(true); // Set isSubmitting to true
      let oldPool = oldSelectedPool.map((item) => item.value);
      let currentPool = selectedPool.map((item) => item.value);

      // let newSetPool = new Set(selectedPool.map((item) => item.value));
      const comparePool = (A, B) => {
        return B.filter((item) => !A.includes(item));
      };

      let newPool = comparePool(oldPool, currentPool);
      let deletePool = comparePool(currentPool, oldPool);

      if (newPool.length + deletePool.length > 0) {
        if (deletePool.length > 0) {
          let response = await DeleteTrainerPool(data.trainer_id, deletePool);
          if (!response.status) {
            Swal.fire("Failed!", "Kolam gagal update.", "error");
          }
        }
        if (newPool.length > 0) {
          let response = await AddTrainerPool(data.trainer_id, newPool);
          if (!response.status) {
            Swal.fire("Failed!", "Kolam gagal update.", "error");
          }
        }

        setOldSelectedPool(selectedPool);
        setSelectedPool(selectedPool);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdd = async (tempData) => {
    try {
      const previousSchedules = await getTrainerScheduleByTrainer(
        data.trainer_id
      );

      if (previousSchedules.data.results.length > 0 && tempData.length === 0) {
        await DeleteTrainerSchedule(data.trainer_id);
      }

      let totalData = 0;
      for (const item of tempData) {
        try {
          const res = await AddTrainerSchedule(item);
          if (res) {
            totalData += 1;
          }
        } catch (errors) {
          console.log(errors);
        }
      }

      if (totalData === tempData.length) {
        Swal.fire("Added!", "Your file has been added.", "success").then(() =>
          navigate(-1)
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handlePoolChange = useCallback((selectedOptions) => {
    setSelectedPool(selectedOptions);
    // onSubmitPool(selectedOptions);
  });

  if (loading) {
    return <Loading />;
  }

  const handleChangeJadwal = (jadwal) => {
    try {
      updateDataList(jadwal);

      const item = {
        ts_id: jadwal.ts_id,
        is_avail: jadwal.is_avail,
        day: jadwal.hari,
        time: jadwal.jam,
      };
      if (jadwal.ts_id === 0) AddTrainerScheduleV2(data.trainer_id, item);
      else EditTrainerScheduleV2(data.trainer_id, item);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChangeJadwalAll = (jadwal) => {
    try {
      setListData((prev) =>
        prev.map((item) =>
          item.trainer_id === data.trainer_id
            ? {
                ...item,
                datahari: item.datahari.map((hari) =>
                  hari.hari === jadwal[0].day
                    ? {
                        ...hari,
                        data: hari.data.map((jam) => ({
                          ...jam,
                          is_avail: jadwal[0].is_avail, // Toggle availability
                        })),
                      }
                    : hari
                ),
              }
            : item
        )
      );

      jadwal.forEach((item) => {
        EditTrainerScheduleV2(data.trainer_id, item);
      });
    } catch (error) {
      console.error(error);
    }
  };

  const loadOptions = async (inputValue, callback) => {
    try {
      const response = await GetTrainerPool(data.trainer_id);
      const pools = getResponseList(response).map((pool) => ({
        value: pool.pool ?? pool.pool_id,
        label: pool.pool_name ?? pool.name,
      }));
      callback(pools);
    } catch (error) {
      callback([]);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Kolam */}
      <Card title={"Kolam"}>
        {isSubmitting && (
          <div className="loading-overlay">
            <Loading /> {/* Show loading indicator during submission */}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmitPool)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* <label className="form-label" htmlFor="kolam">
              Kolam
            </label> */}
            <div className="flex gap-3">
              <AsyncSelect
                name="kolam"
                label="Kolam"
                placeholder="Pilih Kolam"
                isMulti
                defaultOptions={kolamOption}
                loadOptions={loadOptions}
                onChange={handlePoolChange}
                value={selectedPool}
                className="grow"
              />
              <button
                type="submit"
                className="btn btn-sm bg-green-600 hover:bg-green-500 text-gray-100"
                disabled={isSubmitting} // Disable button during submission
              >
                {isSubmitting ? "Saving..." : "Save Kolam"}
              </button>
            </div>
          </div>
        </form>
      </Card>

      {/* Hari */}
      <Card title="Jadwal Pelatih">
        {scheduleLoadError && (
          <div className="mb-4 rounded-md bg-danger-500 bg-opacity-10 px-4 py-3 text-sm text-danger-500">
            {scheduleLoadError}
          </div>
        )}
        {isSubmitting && (
          <div className="loading-overlay">
            <Loading /> {/* Show loading indicator during submission */}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {listData.map((item, i) => (
              <CardJadwal
                key={item.trainer_id || i}
                params={item.datahari}
                onChange={(e) => handleChangeJadwal(e)}
                onChangeAll={(e) => handleChangeJadwalAll(e)}
              />
            ))}
          </div>
        </form>
      </Card>
    </div>
  );
};

export default JadwalBaru;
