import React, { useState, useEffect, useRef } from "react";
import Card from "@/components/ui/Card";
import { getPresenceAll, getPresenceById } from "@/axios/trainer/presence";
import Loading from "@/components/Loading";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";

const Schedule = () => {
  const [events, setEvents] = useState([]);
  const calendarComponentRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  const roles = localStorage.getItem("roles");
  const userid = localStorage.getItem("userid");

  const transformDataForCalendar = (events) => {
    return events.map((event) => ({
      id: event.order_detail_id,
      title: `Coach ${event.trainer_fullname} \n ${event.student_names} \n Pertemuan ${event.meet}`,
      start: new Date(event.schedule_date + " " + event.time.replace(".", ":")),
      end: new Date(event.schedule_date + " " + event.time.replace(".", ":")),
      className: "custom-event",
    }));
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      let res = [];
      if (roles === "Trainer") res = await getPresenceById(userid);
      else res = await getPresenceAll();
      const transformedData = transformDataForCalendar(res.data.data);
      setEvents(transformedData);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        ref={calendarComponentRef}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        }}
        events={events}
        rerenderDelay={10}
        initialView="dayGridMonth"
        eventContent={renderEventContent}
      />
    </div>
  );
};

const renderEventContent = (eventInfo) => {
  return (
    <div className="break-words whitespace-normal p-1 bg-success-400">
      {eventInfo.event.title}
    </div>
  );
};

export default Schedule;
