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
  getTrainerScheduleAll,
} from "@/axios/masterdata/trainerSchedule";

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

const CardJadwal = ({ day, time, selected, setSelected, dataKolam }) => {
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

  return (
    <Card title={day} titleClass="align-center">
      <div className="space-y-4">
        {time.map((option, i) => {
          const isChecked = selected.some((item) =>
            item.startsWith(`${day}#${option.value}`)
          );
          const selectedPool =
            selected
              .find((item) => item.startsWith(`${day}#${option.value}`))
              ?.split("#")[2] || "";

          return (
            <div className="flex gap-2 justify-between">
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
      const kolamResponse = await getKolamAll();
      const trainerScheduleResponse = await getTrainerScheduleAll();
      const kolamOption = kolamResponse.data.results.map((item) => ({
        value: item.pool_id,
        label: item.name,
      }));
      const schOption = kolamResponse.data.results.map((item) => ({
        trainer_schedule_id: item.trainer_schedule_id,
        hari: item.day,
        jam: item.time,
        pool: item.pool,
      }));
      console.log(schOption);
      setKolamOption(kolamOption);

      setSelected([
        "Senin#13.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Senin#14.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Senin#15.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Senin#16.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Senin#17.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Rabu#07.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Rabu#08.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Rabu#09.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Rabu#10.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Rabu#11.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Rabu#13.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Rabu#14.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Rabu#15.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Rabu#16.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Rabu#17.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Kamis#07.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Kamis#08.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Kamis#09.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Kamis#10.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Kamis#11.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Kamis#13.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Kamis#14.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Kamis#15.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Kamis#16.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Kamis#17.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Jumat#07.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Jumat#08.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Jumat#09.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Jumat#10.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Jumat#13.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Jumat#14.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Jumat#15.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Jumat#16.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Jumat#17.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Sabtu#06.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Sabtu#07.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Sabtu#08.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Sabtu#09.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Sabtu#10.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Sabtu#11.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Sabtu#13.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Sabtu#14.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Sabtu#15.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Sabtu#16.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Sabtu#17.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Minggu#06.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Minggu#07.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Minggu#08.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Minggu#09.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Minggu#10.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Minggu#11.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Minggu#13.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Minggu#14.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Minggu#15.00#54a7fd60-610b-4206-b028-4607fceffe24",
        "Minggu#16.00#54a7fd60-610b-4206-b028-4607fceffe24",
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (newData) => {
    let tempData = [];
    selected.map((item) => {
      const [hari, jam, pool] = item.split("#");
      const updatedData = {
        // ...data,
        // fullname: newData.fullname,
        // dob: DateTime.fromJSDate(newData.dob).toFormat("yyyy-MM-dd"),
        // gender: newData.gender,
        // account_number: newData.account_number,
        // precentage_fee: newData.precentage_fee,
        // is_active: selectOption,
        // nickname: newData.nickname,
        // bank_account: newData.bank_account,
        // reg_date: DateTime.fromJSDate(newData.reg_date).toFormat("yyyy-MM-dd"),

        // trainer_schedule_id : ,
        trainer: data.trainer_id,
        day: hari,
        time: jam,
        pool: pool,
      };
      tempData.push(updatedData);
    });
    console.log(tempData);

    // if (isUpdate) {
    //   handleUpdate(updatedData);
    // } else {
    handleAdd(tempData);
    // }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleAdd = (data) => {
    let total_data = 1;
    data.forEach((item) => {
      AddTrainerSchedule(item)
        .then((res) => {
          if (res) {
            total_data += 1;
          }
        })
        .catch((errors) => {
          console.log(errors);
        });
    });
    // if (total_data == data.length()) {
    //   Swal.fire("Added!", "Your file has been added.", "success").then(() =>
    //     navigate(-1)
    //   );
    // }
  };

  const mockdata = [
    {
      day: "Senin",
      time: [
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
        { value: "21.00", label: "21.00" },
      ],
    },
    {
      day: "Selasa",
      time: [
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
        { value: "21.00", label: "21.00" },
      ],
    },
    {
      day: "Rabu",
      time: [
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
        { value: "21.00", label: "21.00" },
      ],
    },
    {
      day: "Kamis",
      time: [
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
        { value: "21.00", label: "21.00" },
      ],
    },
    {
      day: "Jumat",
      time: [
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
        { value: "21.00", label: "21.00" },
      ],
    },
    {
      day: "Sabtu",
      time: [
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
        { value: "21.00", label: "21.00" },
      ],
    },
    {
      day: "Minggu",
      time: [
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
        { value: "21.00", label: "21.00" },
      ],
    },
  ];

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {mockdata.map((item, i) => (
            <CardJadwal
              key={i}
              day={item.day}
              time={item.time}
              selected={selected}
              setSelected={setSelected}
              dataKolam={kolamOption}
            />
          ))}
        </div>
        {selected.length > 0 && (
          <div className="text-slate-900 dark:text-white">
            Selected: [{selected.join(", ")}]
          </div>
        )}
        <div className="ltr:text-right rtl:text-left space-x-3">
          <button
            type="button"
            className="btn text-center"
            onClick={handleCancel}
          >
            Batal
          </button>
          <button type="submit" className="btn btn-dark text-center">
            Save Jadwal
          </button>
        </div>
      </form>
    </>
  );
};

export default Jadwal;
