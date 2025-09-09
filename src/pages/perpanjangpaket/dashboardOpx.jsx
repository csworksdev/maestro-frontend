import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Icon from "@/components/ui/Icon";
import { getFollowupSummary } from "@/axios/perpanjangpaket/perpanjangpaket";
import { toProperCase } from "@/utils";
import LoaderCircle from "@/components/Loader-circle";
import Loading from "@/components/Loading";
import Table from "@/components/globals/table/table";

const DashboardPerpanjangOpx = () => {
  const { user_id, user_name, roles } = useSelector((state) => state.auth.data);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSummary = async () => {
    try {
      const params = { roles: "Opx" };
      const res = await getFollowupSummary({ params });
      setSummary(res.data);
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

  const COLUMNS = [
    {
      Header: "Pelatih",
      accessor: "trainer_name",
      Cell: (row) => {
        return <span>{toProperCase(row?.cell?.value)}</span>;
      },
    },
    {
      Header: "Total Order",
      accessor: "total",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Berjalan",
      accessor: "pending",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Followup",
      accessor: "in_progress",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Perpanjang",
      accessor: "ordered",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Berhenti",
      accessor: "rejected",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Total Siswa",
      accessor: "students",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
  ];

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <>
          {/* <Search searchValue={searchQuery} handleSearch={handleSearch} /> */}
          <Table
            listData={summary}
            listColumn={COLUMNS}
            isAction={false}
            isCheckbox={false}
            // searchValue={searchQuery}
            // handleSearch={handleSearch}
          />
          {/* <PaginationComponent
                  pageSize={pageSize}
                  pageIndex={pageIndex}
                  pageCount={Math.ceil(listData.count / pageSize)}
                  canPreviousPage={pageIndex > 0}
                  canNextPage={pageIndex < Math.ceil(listData.count / pageSize) - 1}
                  gotoPage={handlePageChange}
                  previousPage={() => handlePageChange(pageIndex - 1)}
                  nextPage={() => handlePageChange(pageIndex + 1)}
                  setPageSize={handlePageSizeChange}
                /> */}
        </>
      )}
    </>
    // <div className="space-y-6">
    //   {roles !== "Coach" ? (
    //     // ADMIN → tampilkan semua trainer
    //     summary.map((trainer, idx) => (
    //       <div key={idx}>
    //         <h3 className="text-lg font-semibold mb-3 text-slate-700 dark:text-white">
    //           {toProperCase(trainer.trainer_name)}
    //         </h3>
    //         <div className="grid md:grid-cols-6 gap-4">
    //           {buildStatistics(trainer).map((item, i) => (
    //             <div
    //               key={i}
    //               className={`${item.bg} rounded-md p-4 bg-opacity-[0.15] dark:bg-opacity-50 text-center`}
    //             >
    //               <div
    //                 className={`${item.text} mx-auto h-10 w-10 flex flex-col items-center justify-center rounded-full bg-white text-2xl mb-4`}
    //               >
    //                 <Icon icon={item.icon} />
    //               </div>
    //               <span className="block text-sm text-slate-600 font-medium dark:text-white mb-1">
    //                 {item.title}
    //               </span>
    //               <span className="block text-2xl text-slate-900 dark:text-white font-medium">
    //                 {item.count}
    //               </span>
    //             </div>
    //           ))}
    //         </div>
    //       </div>
    //     ))
    //   ) : (
    //     // COACH → tampilkan hanya summary dirinya
    //     <div className="grid md:grid-cols-6 gap-4">
    //       {buildStatistics(summary[0] || {}).map((trainer, idx) => (
    //         <div
    //           key={idx}
    //           className={`${trainer.bg} rounded-md p-4 bg-opacity-[0.15] dark:bg-opacity-50 text-center`}
    //         >
    //           <div
    //             className={`${trainer.text} mx-auto h-10 w-10 flex flex-col items-center justify-center rounded-full bg-white text-2xl mb-4`}
    //           >
    //             <Icon icon={trainer.icon} />
    //           </div>
    //           <span className="block text-sm text-slate-600 font-medium dark:text-white mb-1">
    //             {trainer.title}
    //           </span>
    //           <span className="block text-2xl text-slate-900 dark:text-white font-medium">
    //             {trainer.count}
    //           </span>
    //         </div>
    //       ))}
    //     </div>
    //   )}
    // </div>
  );
};

export default DashboardPerpanjangOpx;
