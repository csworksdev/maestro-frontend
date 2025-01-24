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
import { baseJadwal } from "@/constant/jadwal-default";
import Swal from "sweetalert2";
import AsyncSelect from "react-select/async";
import Badge from "@/components/ui/Badge";

// Validation schema
const FormValidationSchema = yup.object({}).required();

const Checkbox = ({ name, label, checked, onChange, badge = false }) => (
  <div className={"flex items-center"}>
    <input
      type="checkbox"
      name={name}
      id={name}
      checked={checked}
      onChange={onChange}
      className="form-checkbox"
    />
    <label htmlFor={name} className="ml-2">
      {label}{" "}
      {badge ? (
        !checked ? (
          <Badge
            label="Libur"
            className="bg-danger-500 text-danger-500 bg-opacity-[0.12] pill"
          />
        ) : (
          <Badge
            label="Masuk"
            className="bg-success-500 text-success-500 bg-opacity-[0.12] pill"
          />
        )
      ) : null}
    </label>
  </div>
);

const CardJadwal = ({
  day,
  time,
  selected,
  setSelected,
  dataKolam,
  defaultPool,
  setDefaultPool,
}) => {
  const handleCheckboxChange = (day, timeValue) => {
    const key = `${day}#${timeValue}`;
    if (selected.some((item) => item.startsWith(`${day}#${timeValue}`))) {
      setSelected(
        selected.filter((item) => !item.startsWith(`${day}#${timeValue}`))
      );
    } else {
      setSelected([...selected, key]);
    }
  };

  const handleCheckAllChange = (day) => {
    const allChecked = time.every((option) =>
      selected.some((item) => item.startsWith(`${day}#${option.value}`))
    );

    if (allChecked) {
      setSelected(selected.filter((item) => !item.startsWith(`${day}#`)));
    } else {
      const newSelections = time.map(
        (option) => `${day}#${option.value}#${defaultPool}`
      );
      setSelected((prevSelected) => [
        ...prevSelected.filter((item) => !item.startsWith(`${day}#`)),
        ...newSelections,
      ]);
    }
  };

  return (
    <Card
      title={day}
      headerslot={
        <Checkbox
          name={`${day}#checkall`}
          label="Check All"
          checked={time.every((option) =>
            selected.some((item) => item.startsWith(`${day}#${option.value}`))
          )}
          onChange={() => handleCheckAllChange(day)}
        />
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          {time.map((option, i) => {
            const isChecked = selected.some((item) =>
              item.startsWith(`${day}#${option.value}`)
            );
            const selectedPool =
              selected
                .find((item) => item.startsWith(`${day}#${option.value}`))
                ?.split("#")[2] || "";

            return (
              <div
                className={`border-2 p-2 rounded-lg ${
                  !isChecked ? "border-red-500" : "border-success-500"
                }`}
                key={i}
              >
                <Checkbox
                  name={`${day}#${option.value}`}
                  label={option.label}
                  checked={isChecked}
                  onChange={() => handleCheckboxChange(day, option.value)}
                  badge={true}
                />
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

const inisialData = [
  {
    trainer_id: null,
    kolam: [],
    jadwal: [
      {
        hari: "Senin",
        data: [
          {
            jam: "06.00",
            is_free: true,
            order_id: "",
          },
        ],
      },
      {
        hari: "Selasa",
        data: [
          {
            jam: "06.00",
            is_free: true,
            order_id: "",
          },
        ],
      },
      {
        hari: "Rabu",
        data: [
          {
            jam: "06.00",
            is_free: true,
            order_id: "",
          },
        ],
      },
      {
        hari: "Kamis",
        data: [
          {
            jam: "06.00",
            is_free: true,
            order_id: "",
          },
        ],
      },
      {
        hari: "Jumat",
        data: [
          {
            jam: "06.00",
            is_free: true,
            order_id: "",
          },
        ],
      },
      {
        hari: "Sabtu",
        data: [
          {
            jam: "06.00",
            is_free: true,
            order_id: "",
          },
        ],
      },
      {
        hari: "Minggu",
        data: [
          {
            jam: "06.00",
            is_free: true,
            order_id: "",
          },
        ],
      },
    ],
  },
];

const JadwalBaru = ({ data }) => {
  const [selected, setSelected] = useState([]);
  const [kolamOption, setKolamOption] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for submission status
  const navigate = useNavigate();
  const [listData, setListData] = useState(inisialData);

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
      const trainerScheduleResponse = await getTrainerScheduleByTrainer(
        data.trainer_id
      );

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
      const schOption = trainerScheduleResponse.data.results.map((item) => ({
        trainer_schedule_id: item.trainer_schedule_id,
        day: item.day,
        time: item.time,
        pool: item.pool,
      }));

      schOption.forEach((item) => {
        const key = `${item.day}#${item.time}#${item.pool}`;
        setSelected((prevSelected) => [...prevSelected, key]);
      });

      setKolamOption(kolamOption);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (newData) => {
    setIsSubmitting(true); // Start submission
    const uniqueSelected = [...new Set(selected)]; // Removes duplicate entries in selected
    const tempData = uniqueSelected.map((item) => {
      const [day, time, pool] = item.split("#");
      return {
        trainer: data.trainer_id,
        day: day,
        time: time,
        pool: pool,
        is_free: true,
      };
    });
    await handleAdd(tempData);
    setIsSubmitting(false); // End submission
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

  const selectedJadwal = (jadwal) => {
    console.log(jadwal);
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
              loadOptions={kolamOption}
              onChange={handlePoolChange}
              isOptionDisabled={() =>
                listData.find((item) => item.trainer_id === data.trainer_id)
                  ?.kolam.length >= (data.is_fulltime ? 10 : 1)
              }
              className="grow"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {baseJadwal.map((item, i) => (
            <CardJadwal
              key={i}
              day={item.day}
              time={item.time}
              selected={selected}
              setSelected={(e) => selectedJadwal(e)}
              dataKolam={kolamOption}
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
