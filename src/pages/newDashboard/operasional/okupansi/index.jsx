import { getOkupansi } from "@/axios/dashboard_opr/okupansi";
import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import Okupansi from ".";

const DashboardOkupansi = () => {
  const [branch, setBranch] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await getOkupansi();
      if (res) setBranch(res.data);
    };

    fetchData();
  }, []);

  return (
    <>
      <Okupansi data={branch} />
    </>
  );
};

export default DashboardOkupansi;
