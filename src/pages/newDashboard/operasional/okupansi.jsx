import Calculation from "@/components/partials/widget/chart/Calculation";
import Card from "@/components/ui/Card";
import { colors } from "@/constant/data";
import ChartJs from "@/pages/chart/chartjs";
import React from "react";
import Chart from "react-apexcharts";
import useDarkMode from "@/hooks/useDarkMode";

const OkupansiBranch = ({ data, height = 335 }) => {
  const [isDark] = useDarkMode();
  return (
    <div className="grid grid-cols-4 gap-4">
      {data
        .sort(
          (a, b) =>
            (b.total_slot_terisi / b.total_slot_tersedia) * 100 -
            (a.total_slot_terisi / a.total_slot_tersedia) * 100
        )
        .map((x, index) => {
          const series = [x.total_slot_terisi, x.total_slot_kosong];
          const persenIsi =
            Math.round((x.total_slot_terisi / x.total_slot_tersedia) * 100) +
            " %";
          const persenKosong =
            Math.round((x.total_slot_kosong / x.total_slot_tersedia) * 100) +
            " %";

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
            <Card title={"#1" + index} subtitle={x.branch_name}>
              <div>Jadwal Tersedia : {x.total_slot_tersedia}</div>
              <div>Jadwal Terisi : {x.total_slot_terisi}</div>
              <div>Jadwal Kosong : {x.total_slot_kosong}</div>
              <Chart
                options={options}
                series={series}
                type="pie"
                height={height}
              />
            </Card>
          );
        })}
    </div>
  );
};

export default OkupansiBranch;
