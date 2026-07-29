import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Card from "@/components/ui/Card";
import Chart from "react-apexcharts";
import { getHydroDashboardChart } from "@/axios/hydro/chart";
import { getHydroDashboardTherapy } from "@/axios/hydro/therapy";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import GlobalChartFilter from "@/components/partials/filters/GlobalChartFilter";

const fallbackSeries = [
  {
    name: "Nilai",
    data: [0, 0, 0, 0, 0, 0],
  },
];

const fallbackCategories = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun"];

const HydroDashboardChartPage = () => {
  const location = useLocation();
  const { filter } = useGlobalFilter();
  const [loading, setLoading] = useState(false);
  const [series, setSeries] = useState(fallbackSeries);
  const [categories, setCategories] = useState(fallbackCategories);
  const [seriesTherapy, setSeriesTherapy] = useState(fallbackSeries);
  const [categoriesTherapy, setCategoriesTherapy] =
    useState(fallbackCategories);

  const params = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return {
      filter_type: searchParams.get("filter_type") || filter.filter_type,
      filter_value: Number(
        searchParams.get("filter_value") || filter.filter_value,
      ),
      filter_year: Number(
        searchParams.get("filter_year") || filter.filter_year,
      ),
      filter_branch_id:
        searchParams.get("filter_branch_id") || filter.filter_branch_id,
      filter_pool_id:
        searchParams.get("filter_pool_id") || filter.filter_pool_id,
    };
  }, [filter, location.search]);

  useEffect(() => {
    const loadChart = async () => {
      setLoading(true);
      try {
        const response = await getHydroDashboardChart(params);
        const payload = response?.data ?? response ?? {};
        // Handle API shape: { data: { chart: [...] } }
        const chartData = payload?.data?.chart ?? payload?.chart ?? null;

        if (Array.isArray(chartData) && chartData.length) {
          // Use active_male and active_female only (ignore inactive)
          const maleSeries = chartData.map((it) =>
            Number(it?.active_male ?? 0),
          );
          const femaleSeries = chartData.map((it) =>
            Number(it?.active_female ?? 0),
          );
          const cats = chartData.map((it) => it?.label ?? it?.value ?? "-");

          // If both series are all zeros, fallback
          const hasAny =
            maleSeries.some((v) => v) || femaleSeries.some((v) => v);
          if (hasAny) {
            setSeries([
              { name: "Active Male", data: maleSeries },
              { name: "Active Female", data: femaleSeries },
            ]);
            setCategories(cats);
          } else {
            setSeries(fallbackSeries);
            setCategories(fallbackCategories);
          }
        } else {
          const results =
            payload?.results ?? payload?.data ?? payload?.detail ?? [];
          if (Array.isArray(results) && results.length) {
            const extractedSeries = results.map((item) =>
              Number(item?.value ?? item?.total ?? 0),
            );
            const extractedCategories = results.map(
              (item) => item?.label ?? item?.name ?? "-",
            );
            setSeries([{ name: "Nilai", data: extractedSeries }]);
            setCategories(extractedCategories);
          } else {
            setSeries(fallbackSeries);
            setCategories(fallbackCategories);
          }
        }
      } catch (err) {
        console.error(err);
        setSeries(fallbackSeries);
        setCategories(fallbackCategories);
      } finally {
        setLoading(false);
      }
    };

    loadChart();
  }, [params]);

  useEffect(() => {
    let cancelled = false;

    const loadTherapy = async () => {
      try {
        const res = await getHydroDashboardTherapy(params);
        const payload = res?.data ?? res ?? {};

        // Accept either { data: { chart: [...] } } or { data: [...] }
        const chartDataCandidate =
          Array.isArray(payload?.data) && payload.data.length
            ? payload.data
            : (payload?.data?.chart ?? payload?.chart ?? null);

        const chartData = Array.isArray(chartDataCandidate)
          ? chartDataCandidate
          : null;

        if (chartData && chartData.length) {
          const maleSeries = chartData.map((it) =>
            Number(it?.active_male ?? 0),
          );
          const femaleSeries = chartData.map((it) =>
            Number(it?.active_female ?? 0),
          );
          // use name if present, otherwise label or id
          const cats = chartData.map(
            (it) => it?.name ?? it?.label ?? it?.id ?? "-",
          );

          if (!cancelled) {
            setSeriesTherapy([
              { name: "Active Male", data: maleSeries },
              { name: "Active Female", data: femaleSeries },
            ]);
            setCategoriesTherapy(cats);
            return;
          }
        }

        if (!cancelled) {
          setSeriesTherapy(fallbackSeries);
          setCategoriesTherapy(fallbackCategories);
        }
      } catch (err) {
        console.error("Error loading therapy chart:", err);
        if (!cancelled) {
          setSeriesTherapy(fallbackSeries);
          setCategoriesTherapy(fallbackCategories);
        }
      }
    };

    loadTherapy();

    return () => {
      cancelled = true;
    };
  }, [params]);

  const chartOptions = {
    chart: {
      type: "bar",
      height: 350,
    },
    xaxis: {
      categories,
    },
    title: {
      text: "Dashboard Hydro",
    },
    responsive: [
      {
        breakpoint: 640,
        options: {
          chart: { height: 300 },
        },
      },
    ],
  };

  return (
    <div className="p-6">
      <GlobalChartFilter />
      <Card title="Hydro Dashboard Chart">
        {loading && <p>Memuat data...</p>}
        {!loading && (
          <Chart
            options={chartOptions}
            series={series}
            type="bar"
            height={350}
          />
        )}
      </Card>
      <div className="mt-6">
        <Card title="Hydro Therapy Chart">
          <Chart
            options={{
              ...chartOptions,
              xaxis: { categories: categoriesTherapy },
            }}
            series={seriesTherapy}
            type="bar"
            height={350}
          />
        </Card>
      </div>
    </div>
  );
};

export default HydroDashboardChartPage;
