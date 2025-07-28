import { getOkupansiBranch } from "@/axios/dashboard_opr/okupansi";
import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import OkupansiBranch from "./okupansi";

const DashboardOkupansi = () => {
  const [branch, setBranch] = useState([]);

  useEffect(async () => {
    let res = await getOkupansiBranch();
    if (res) setBranch(res.data);
  }, []);

  return (
    <div>
      <div>test</div>
      <OkupansiBranch data={branch} />
    </div>
  );
};

export default DashboardOkupansi;
