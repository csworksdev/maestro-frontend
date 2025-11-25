import React, { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const CalendarView = ({ details = [], onDateChange, selectedDate }) => {
  const initialDate = useMemo(() => {
    const first = details.find((d) => d?.date);
    return first ? new Date(first.date) : null;
  }, [details]);
  const today = useMemo(() => new Date(), []);

  const [value, onChange] = useState(() => initialDate || new Date());
  const detailMap = useMemo(() => {
    const map = new Map();
    details.forEach((item) => {
      if (!item?.date) return;
      map.set(item.date, item);
    });
    return map;
  }, [details]);

  const dateToKey = (dateObj) =>
    new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10); // YYYY-MM-DD without TZ shift

  const handleChange = (nextValue) => {
    if (nextValue instanceof Date) {
      const nextKey = dateToKey(nextValue);
      const payload = detailMap.get(nextKey) || null;
      onChange(nextValue);
      if (onDateChange) {
        onDateChange({ date: nextKey, data: payload });
      }
    }
  };

  useEffect(() => {
    if (!selectedDate) return;
    const dateObj = new Date(selectedDate);
    if (!isNaN(dateObj)) {
      onChange(dateObj);
    }
  }, [selectedDate]);

  const renderTileContent = ({ date, view }) => {
    if (view !== "month") return null;
    const dateKey = dateToKey(date);
    const dayData = detailMap.get(dateKey);
    if (!dayData) return null;
    return null; // hanya tampil tanggal bawaan kalender
  };

  return (
    <div>
      <Calendar
        onChange={handleChange}
        value={value}
        defaultActiveStartDate={today}
        tileContent={renderTileContent}
      />
    </div>
  );
};

export default CalendarView;
