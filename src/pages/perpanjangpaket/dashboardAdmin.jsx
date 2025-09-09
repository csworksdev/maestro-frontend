import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Icon from "@/components/ui/Icon";
import { getFollowupSummary } from "@/axios/perpanjangpaket/perpanjangpaket";
import { toProperCase } from "@/utils";
import LoaderCircle from "@/components/Loader-circle";

const DashboardPerpanjangAdmin = () => {
  const { user_id, user_name, roles } = useSelector((state) => state.auth.data);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSummary = async () => {
    try {
      const params = { roles: "Admin" };

      const res = await getFollowupSummary({ params });

      setSummary(res.data.results);
    } catch (err) {
      console.error("Failed to fetch followup summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  if (loading) return <LoaderCircle />;

  // helper untuk bikin statistik card
  const buildStatistics = (data) => [
    {
      title: "Total Orders",
      count: data.total || 0,
      bg: "bg-info-500",
      text: "text-info-500",
      icon: "heroicons-outline:menu-alt-1",
    },
    {
      title: "Pending",
      count: data.pending || 0,
      bg: "bg-warning-500",
      text: "text-warning-500",
      icon: "heroicons-outline:clock",
    },
    {
      title: "In Progress",
      count: data.in_progress || 0,
      bg: "bg-primary-500",
      text: "text-primary-500",
      icon: "heroicons-outline:chart-pie",
    },
    {
      title: "Perpanjang",
      count: data.ordered || 0,
      bg: "bg-success-500",
      text: "text-success-500",
      icon: "heroicons-outline:check-circle",
    },
    {
      title: "Berhenti",
      count: data.rejected || 0,
      bg: "bg-danger-500",
      text: "text-danger-500",
      icon: "heroicons-outline:x-circle",
    },
    {
      title: "Total Students",
      count: data.students || 0,
      bg: "bg-indigo-500",
      text: "text-indigo-500",
      icon: "heroicons-outline:user-group",
    },
  ];

  return (
    <div className="space-y-6">
      {summary.map((trainer, idx) => (
        <div key={idx}>
          <h3 className="text-lg font-semibold mb-3 text-slate-700 dark:text-white">
            {toProperCase(trainer.trainer_name)}
          </h3>
          <div className="grid md:grid-cols-6 gap-4">
            {buildStatistics(trainer).map((item, i) => (
              <div
                key={i}
                className={`${item.bg} rounded-md p-4 bg-opacity-[0.15] dark:bg-opacity-50 text-center`}
              >
                <div
                  className={`${item.text} mx-auto h-10 w-10 flex flex-col items-center justify-center rounded-full bg-white text-2xl mb-4`}
                >
                  <Icon icon={item.icon} />
                </div>
                <span className="block text-sm text-slate-600 font-medium dark:text-white mb-1">
                  {item.title}
                </span>
                <span className="block text-2xl text-slate-900 dark:text-white font-medium">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardPerpanjangAdmin;
