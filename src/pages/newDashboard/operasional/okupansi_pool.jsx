import Card from "@/components/ui/Card";
import { colors } from "@/constant/data";
import React from "react";
import Chart from "react-apexcharts";
import useDarkMode from "@/hooks/useDarkMode";
import Button from "@/components/ui/Button";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toProperCase } from "@/utils";

const OkupansiPool = ({ height = 335 }) => {
  const [isDark] = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();
  const { pool_name, data, heatmap } = location.state || {};

  return (
    <>
      <Button
        text="Kembali"
        onClick={(e) => {
          e.preventDefault();
          navigate(-1);
        }}
        type="button"
        className="bg-primary-500 text-white mb-4"
        icon="heroicons-outline:arrow-uturn-left"
      />
      <div className="flex flex-col gap-8">
        <Card>
          <h5>Kolam : {pool_name}</h5>
        </Card>
        <div className="grid grid-cols-6 gap-4">
          {data
            .sort(
              (a, b) =>
                (b.total_slot_terisi / b.total_slot_tersedia) * 100 -
                (a.total_slot_terisi / a.total_slot_tersedia) * 100
            )
            .map((x, index) => {
              const series = [x.total_slot_terisi, x.total_slot_kosong];
              const persenIsi =
                Math.round(
                  (x.total_slot_terisi / x.total_slot_tersedia) * 100
                ) + " %";
              const persenKosong =
                Math.round(
                  (x.total_slot_kosong / x.total_slot_tersedia) * 100
                ) + " %";

              const options = {
                labels: ["Terisi " + persenIsi, "Kosong " + persenKosong],
                dataLabels: {
                  enabled: true,
                },

                colors: [colors.success, colors.warning, "#A3A1FB"],
                legend: {
                  position: "bottom",
                  fontSize: "12px",
                  fontFamily: "Inter",
                  fontWeight: 400,
                  labels: {
                    colors: isDark ? "#CBD5E1" : "#475569",
                  },
                  markers: {
                    width: 6,
                    height: 6,
                    offsetY: -1,
                    offsetX: -5,
                    radius: 12,
                  },
                  itemMargin: {
                    horizontal: 10,
                    vertical: 0,
                  },
                },

                responsive: [
                  {
                    breakpoint: 480,
                    options: {
                      legend: {
                        position: "bottom",
                      },
                    },
                  },
                ],
              };
              return (
                <Card
                  title={
                    "#" + (index + 1) + " - " + toProperCase(x.trainer_nickname)
                  }
                  key={x.id + index}
                >
                  {/* <div>Jumlah Pelatih : {x.jumlah_pelatih}</div> */}
                  <div>
                    Tersedia :{" "}
                    {parseInt(x.total_slot_tersedia).toLocaleString("id-ID")}
                  </div>
                  <div>
                    Terisi :{" "}
                    {parseInt(x.total_slot_terisi).toLocaleString("id-ID")}
                  </div>
                  <div>
                    Kosong :{" "}
                    {parseInt(x.total_slot_kosong).toLocaleString("id-ID")}
                  </div>
                  <Chart
                    options={options}
                    series={series}
                    type="pie"
                    height={height}
                  />
                  {/* <Button>
                    <label>Lihat Detail</label>
                  </Button> */}
                </Card>
              );
            })}
        </div>

        <Card>
          <h5>Heatmap</h5>
        </Card>
        <div className="grid grid-cols-7 gap-4">
          {heatmap &&
            heatmap.map((item, index) => {
              return (
                <Card subtitle={item.day} key={item.day + index}>
                  <div className="grid grid-cols-2 text-center">
                    <div>Hari</div>
                    <div>Order</div>
                  </div>
                  {item.data.map((day, x) => {
                    return (
                      <div className="grid grid-cols-2">
                        <div>{day.time}</div>
                        <div className="text-right">{day.count}</div>
                      </div>
                    );
                  })}
                </Card>
              );
            })}
        </div>
      </div>
    </>
  );
};

export default OkupansiPool;
