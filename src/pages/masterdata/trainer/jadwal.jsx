import Card from "@/components/ui/Card";
// import Checkbox from "@/components/ui/Checkbox";
import React, { useState } from "react";

const CardJadwal = ({ day, time, selected, setSelected }) => {
  const handleCheckboxChange = (day, timeValue) => {
    const key = `${day}#${timeValue}`;
    if (selected.includes(key)) {
      setSelected(selected.filter((item) => item !== key));
    } else {
      setSelected([...selected, key]);
    }
  };

  return (
    <Card title={day}>
      <div className="space-y-4">
        {time.map((option, i) => (
          <Checkbox
            key={i}
            name={`${day}#${option.value}`}
            label={option.label}
            checked={selected.includes(`${day}#${option.value}`)}
            onChange={() => handleCheckboxChange(day, option.value)}
          />
        ))}
      </div>
    </Card>
  );
};

const Checkbox = ({ name, label, checked, onChange }) => {
  return (
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
};

const Jadwal = () => {
  const [selected, setSelected] = useState([]);

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

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        {mockdata.map((item, i) => (
          <CardJadwal
            key={i}
            day={item.day}
            time={item.time}
            selected={selected}
            setSelected={setSelected}
          />
        ))}
      </div>
      {selected.length > 0 && (
        <div className="text-slate-900 dark:text-white ">
          Selected: [{selected.join(", ")}]
        </div>
      )}
    </>
  );
};

export default Jadwal;
