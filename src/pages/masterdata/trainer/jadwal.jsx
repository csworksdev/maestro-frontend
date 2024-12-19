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
import { mockdata } from "@/constant/jadwal-default";
import Swal from "sweetalert2";

// Validation schema
const FormValidationSchema = yup.object({}).required();

const Checkbox = ({ name, label, checked, onChange }) => (
  <div className="flex items-center">
    <input
      type="checkbox"
      name={name}
      id={name}
      checked={checked}
      onChange={onChange}
      className="form-checkbox"
    />
    <label htmlFor={name} className="ml-2">
      {label}
    </label>
  </div>
);

const Select = ({ name, placeholder, options, value, disabled, onChange }) => (
  <select
    name={name}
    value={value}
    disabled={disabled}
    onChange={onChange}
    className="form-select"
  >
    <option value="">{placeholder}</option>
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
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

  const handlePoolChange = (day, timeValue, pool) => {
    const key = `${day}#${timeValue}#${pool}`;
    setSelected((prevSelected) => {
      const updatedSelected = prevSelected.filter(
        (item) => !item.startsWith(`${day}#${timeValue}`)
      );
      return [...updatedSelected, key];
    });
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
    <Card title={day} titleClass="align-center">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Checkbox
            name={`${day}#checkall`}
            label="Check All"
            checked={time.every((option) =>
              selected.some((item) => item.startsWith(`${day}#${option.value}`))
            )}
            onChange={() => handleCheckAllChange(day)}
          />
        </div>
        {time.map((option, i) => {
          const isChecked = selected.some((item) =>
            item.startsWith(`${day}#${option.value}`)
          );
          const selectedPool =
            selected
              .find((item) => item.startsWith(`${day}#${option.value}`))
              ?.split("#")[2] || "";

          return (
            <div className="flex gap-2 justify-between" key={i}>
              <Checkbox
                name={`${day}#${option.value}`}
                label={option.label}
                checked={isChecked}
                onChange={() => handleCheckboxChange(day, option.value)}
              />
              <Select
                name="pool"
                placeholder="Pilih Kolam"
                options={[{ value: "", label: "Pilih Kolam" }, ...dataKolam]}
                disabled={!isChecked}
                value={selectedPool}
                onChange={(e) =>
                  handlePoolChange(day, option.value, e.target.value)
                }
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const Jadwal = ({ data }) => {
  const [selected, setSelected] = useState([]);
  const [kolamOption, setKolamOption] = useState([]);
  const [loading, setLoading] = useState(true);
  const [defaultPool, setDefaultPool] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for submission status
  const navigate = useNavigate();

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
  }, []);

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

      const kolamOption = kolamResponse.data.results.map((item) => ({
        value: item.pool_id,
        label: item.name,
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

  if (loading) {
    return <Loading />;
  }

  return (
    <Card title="Jadwal Pelatih">
      {isSubmitting && (
        <div className="loading-overlay">
          <Loading /> {/* Show loading indicator during submission */}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          name="defaultPool"
          placeholder="Default Pool"
          options={[{ value: "", label: "Pilih Kolam" }, ...kolamOption]}
          value={defaultPool}
          onChange={(e) => setDefaultPool(e.target.value)}
        />
        <div className="grid grid-cols-3 gap-4">
          {mockdata.map((item, i) => (
            <CardJadwal
              key={i}
              day={item.day}
              time={item.time}
              selected={selected}
              setSelected={setSelected}
              dataKolam={kolamOption}
              defaultPool={defaultPool}
              setDefaultPool={setDefaultPool}
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

export default Jadwal;
