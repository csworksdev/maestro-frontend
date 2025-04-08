// src/components/Jadwal.js
import { getKolamAll } from "@/axios/referensi/kolam";
import Loading from "@/components/Loading";
import Card from "@/components/ui/Card";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import {
  AddTrainerSchedule,
  getTrainerScheduleByTrainer,
  DeleteTrainerSchedule,
} from "@/axios/masterdata/trainerSchedule";
import { baseJadwal, mockDataJadwal } from "@/constant/jadwal-default";
import Swal from "sweetalert2";
import AsyncSelect from "react-select/async";
import Badge from "@/components/ui/Badge";
import {
  AddTrainerScheduleNew,
  EditTrainerScheduleNew,
  getTrainerScheduleByTrainerNew,
} from "@/axios/masterdata/trainerScheduleNew";

// Validation schema
const FormValidationSchema = yup.object({}).required();

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
              <Checkbox
                name={item.hari}
                key={item.hari}
                label={"pilih semua"}
                checked={item.data.every((jam) => jam.is_avail)}
                onChange={() => onChangeAll(item.hari)}
              />
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
                          onChange({ hari: item.hari, jam: option.jam })
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
  const [selectedPool, setSelectedPool] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for submission status
  const navigate = useNavigate();
  const [listData, setListData] = useState([]);

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "all",
  });

  useEffect(() => {
    loadReference();
    setListData((prevListData) =>
      prevListData.map((item) =>
        typeof item === "object"
          ? { ...item, trainer_id: data.trainer_id }
          : item
      )
    );
  }, [data.trainer_id]);

  useEffect(() => {
    if (data?.trainer_id) {
      setListData((prevListData) =>
        prevListData.map((item) => ({
          ...item,
          trainer_id: data.trainer_id, // Set the trainer_id dynamically
        }))
      );
    }
  }, [data?.trainer_id]);

  const loadReference = async () => {
    try {
      const params = {
        page: 1,
        page_size: 200,
        is_active: true,
      };
      const kolamResponse = await getKolamAll(params);
      // const trainerScheduleResponse = await getTrainerScheduleByTrainer(
      //   data.trainer_id
      // );

      const kolamOption = kolamResponse.data.results
        .sort(
          (a, b) =>
            a.branch_name.localeCompare(b.branch_name) ||
            a.name.localeCompare(b.name)
        )
        .map((item) => ({
          value: item.pool_id,
          label: item.branch_name + " - " + item.name,
        }));
      setKolamOption(kolamOption);

      const jadwalOption = await getTrainerScheduleByTrainerNew(
        data.trainer_id
      );

      mockDataJadwal[0].trainer_id = data.trainer_id;

      let tempJadwal =
        jadwalOption.data.results.length > 0
          ? jadwalOption.data.results
          : mockDataJadwal;

      setListData(tempJadwal);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (newData) => {
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

  const handlePoolChange = (selectedOptions) => {
    setListData((prev) =>
      prev.map((item) =>
        item.trainer_id === data.trainer_id
          ? {
              ...item,
              kolam:
                selectedOptions.length === 0
                  ? []
                  : selectedOptions.map((opt) => opt.value),
            }
          : item
      )
    );
  };

  if (loading) {
    return <Loading />;
  }

  const handleChangeJadwal = (jadwal) => {
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
                          ? {
                              ...jam,
                              is_avail: !jam.is_avail,
                            }
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

  const handleChangeJadwalAll = (jadwal) => {
    setListData((prev) =>
      prev.map((item) =>
        item.trainer_id === data.trainer_id
          ? {
              ...item,
              datahari: item.datahari.map((hari) =>
                hari.hari === jadwal
                  ? {
                      ...hari,
                      data: hari.data.map((jam) => ({
                        ...jam,
                        is_avail: !jam.is_avail,
                      })),
                    }
                  : hari
              ),
            }
          : item
      )
    );
  };

  return (
    <Card title="Jadwal Pelatih">
      {isSubmitting && (
        <div className="loading-overlay">
          <Loading /> {/* Show loading indicator during submission */}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="form-label" htmlFor="kolam">
            Kolam
          </label>
          <div className="flex gap-3">
            <AsyncSelect
              name="kolam"
              label="Kolam"
              placeholder="Pilih Kolam"
              isMulti
              defaultOptions={kolamOption}
              onChange={handlePoolChange}
              defaultValue={null}
              isOptionDisabled={() =>
                listData.find((item) => item.trainer_id === data.trainer_id)
                  ?.kolam.length >= (data.is_fulltime ? 10 : 1)
              }
              className="grow"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {mockDataJadwal.map((item, i) => (
            <CardJadwal
              key={i}
              params={item.datahari}
              onChange={(e) => handleChangeJadwal(e)}
              onChangeAll={(e) => handleChangeJadwalAll(e)}
            />
          ))}
        </div>
        <div className="ltr:text-right rtl:text-left space-x-3">
          <div className="btn-group">
            <button type="button" className="btn" onClick={handleCancel}>
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-dark"
              disabled={isSubmitting} // Disable button during submission
            >
              {isSubmitting ? "Saving..." : "Save Jadwal"}
            </button>
          </div>
        </div>
      </form>
    </Card>
  );
};

export default JadwalBaru;
