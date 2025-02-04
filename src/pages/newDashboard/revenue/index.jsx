import React, { useEffect, useState } from "react";
import Header from "../header";
import { getRevenueAll } from "@/axios/dashboard/revenue";
import Card from "@/components/ui/Card";

const Revenue = () => {
  const [revenueAll, setRevenueAll] = useState([]);
  const icons = ["shopping-bag", "banknotes", "user", "user-group"];
  useEffect(() => {
    const loadReference = async () => {
      await getRevenueAll().then((response) => {
        setRevenueAll(response.data);
      });
    };
    loadReference();
  }, []);

  return (
    <Card bodyClass="p-4">
      <div className="grid md:grid-cols-4 col-span-1 gap-4">
        <Header
          data={revenueAll}
          icons={icons}
          colors={["#EAE5FF", "#E5F9FF", "#FFEDE5", "#faf4a5"]}
        />
      </div>
    </Card>
  );
};

export default Revenue;
