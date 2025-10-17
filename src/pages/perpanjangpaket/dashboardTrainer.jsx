import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/redux/slicers/authSlice";
import Icon from "@/components/ui/Icon";
import {
  getFollowupSummary,
  getPendingFollowUpView,
} from "@/axios/perpanjangpaket/perpanjangpaket";
import LoaderCircle from "@/components/Loader-circle";
import Card from "@/components/ui/Card";
import SkeletionTable from "@/components/skeleton/Table";
import Table from "@/components/globals/table/table";
import PaginationComponent from "@/components/globals/table/pagination";
import { DateTime } from "luxon";
import Search from "@/components/globals/table/search";

const DashboardPerpanjangTrainer = () => {
  const { user_id, roles } = useAuthStore((state) => state.data);

  const [summary, setSummary] = useState([]);
  const [listData, setListData] = useState({ count: 0, results: [] });
  const [loading, setLoading] = useState(true);

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchSummary = async () => {
    try {
      const params = { roles: roles, trainer_id: user_id };
      const res = await getFollowupSummary({ params });
      setSummary(res.data.results);
    } catch (err) {
      console.error("Failed to fetch summary:", err);
    }
  };

  const fetchPending = async (page, size, query) => {
    try {
      const params = {
        page: page + 1,
        page_size: size,
        search: query,
        roles: roles,
        trainer_id: user_id,
      };
      const res = await getPendingFollowUpView({ params });
      setListData(res.data);
    } catch (err) {
      console.error("Failed to fetch pending followups:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchSummary(),
        fetchPending(pageIndex, pageSize, searchQuery),
      ]);
      setLoading(false);
    };
    loadData();
  }, [pageIndex, pageSize, searchQuery, roles, user_id]);

  const handlePageChange = (page) => setPageIndex(page);
  const handlePageSizeChange = (size) => setPageSize(size);
  const handleSearch = (query) => {
    setSearchQuery(query);
    setPageIndex(0);
  };

  const COLUMNS = [
    {
      Header: "Siswa",
      accessor: "student_name",
      Cell: (row) => <span>{row?.cell?.value}</span>,
    },
    {
      Header: "Tanggal Follow Up",
      accessor: "pending_date",
      Cell: (row) =>
        row?.cell?.value
          ? DateTime.fromISO(row?.cell?.value).toFormat("dd LLLL yyyy")
          : "-",
    },
    {
      Header: "Nomor Wa",
      accessor: "student_phone",
      Cell: (row) => <span>{row?.cell?.value}</span>,
    },
  ];

  const buildStatistics = (data) => [
    {
      title: "Total Paket",
      count: data.total || 0,
      bg: "bg-info-500",
      text: "text-info-500",
      icon: "heroicons-outline:menu-alt-1",
    },
    {
      title: "Paket Berjalan",
      count: data.pending || 0,
      bg: "bg-warning-500",
      text: "text-warning-500",
      icon: "heroicons-outline:clock",
    },
    {
      title: "Sedang Follow Up",
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
      title: "Total Siswa",
      count: data.students || 0,
      bg: "bg-indigo-500",
      text: "text-indigo-500",
      icon: "heroicons-outline:user-group",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {buildStatistics(summary[0] || {}).map((item, idx) => (
          <div
            key={idx}
            className={`${item.bg} rounded-md p-4 bg-opacity-[0.15] dark:bg-opacity-50 text-center`}
          >
            <div
              className={`${item.text} mx-auto h-10 w-10 flex items-center justify-center rounded-full bg-white text-2xl mb-4`}
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

      <Card title="Siswa Follow Up" className="mt-6">
        {loading ? (
          <SkeletionTable />
        ) : (
          <>
            <Search searchValue={searchQuery} handleSearch={handleSearch} />
            <Table
              listData={listData}
              listColumn={COLUMNS}
              searchValue={searchQuery}
              handleSearch={handleSearch}
              isAction={false}
            />
            <PaginationComponent
              pageSize={pageSize}
              pageIndex={pageIndex}
              pageCount={Math.ceil(listData.count / pageSize)}
              canPreviousPage={pageIndex > 0}
              canNextPage={pageIndex < Math.ceil(listData.count / pageSize) - 1}
              gotoPage={handlePageChange}
              previousPage={() => handlePageChange(pageIndex - 1)}
              nextPage={() => handlePageChange(pageIndex + 1)}
              setPageSize={handlePageSizeChange}
            />
          </>
        )}
      </Card>
    </>
  );
};

export default DashboardPerpanjangTrainer;
