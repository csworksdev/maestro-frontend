import React, { useEffect, useState } from "react";
import {
  getRevenueAll,
  getRevenueAllPerTahun,
  getRevenueAllPerCabang,
  getRevenueAllPerProduk,
} from "@/axios/dashboard/revenue";
import Card from "@/components/ui/Card";
import BarChart from "@/components/globals/chart/barChart";
import ListLoading from "@/components/skeleton/ListLoading";
import Header from "@/components/globals/chart/header";

const Revenue = () => {
  const [revenueAll, setRevenueAll] = useState([]);
  const [revenueAllTahun, setRevenueAllTahun] = useState([]);
  const [revenueAllCabang, setRevenueAllCabang] = useState([]);
  const [revenueAllProduk, setRevenueAllProduk] = useState([]);
  const icons = ["shopping-bag", "banknotes", "user", "user-group"];

  useEffect(() => {
    const loadReference = async () => {
      const [
        revenueAllRes,
        revenueAllTahunRes,
        revenueAllCabangRes,
        revenueAllProdukRes,
      ] = await Promise.all([
        getRevenueAll(),
        getRevenueAllPerTahun(),
        getRevenueAllPerCabang(),
        getRevenueAllPerProduk(),
      ]);

      setRevenueAll(revenueAllRes.data);
      setRevenueAllTahun(revenueAllTahunRes.data);
      setRevenueAllCabang(revenueAllCabangRes.data);
      setRevenueAllProduk(revenueAllProdukRes.data);
    };

    loadReference();
  }, []);

  return (
    <>
      <Card bodyClass="p-4 mb-5">
        <div className="grid md:grid-cols-4 col-span-1 gap-4">
          <Header
            data={revenueAll}
            icons={icons}
            colors={["#EAE5FF", "#E5F9FF", "#FFEDE5", "#faf4a5"]}
          />
        </div>
      </Card>
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12">
          <Card>
            <div className="legend-ring">
              {revenueAllTahun.series ? (
                <BarChart data={revenueAllTahun} title={"Revenue Per Tahun"} />
              ) : (
                <ListLoading />
              )}
            </div>
          </Card>
        </div>
        <div className="col-span-12">
          <Card>
            <div className="legend-ring">
              {revenueAllCabang.series ? (
                <BarChart
                  data={revenueAllCabang}
                  title={"Revenue Per Cabang"}
                />
              ) : (
                <ListLoading />
              )}
            </div>
          </Card>
        </div>
        <div className="col-span-12">
          <Card>
            <div className="legend-ring">
              {revenueAllProduk.series ? (
                <BarChart
                  data={revenueAllProduk}
                  title={"Revenue Per Produk"}
                />
              ) : (
                <ListLoading />
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Revenue;
