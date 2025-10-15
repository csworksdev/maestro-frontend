import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Icon from "@/components/ui/Icon";
import {
  getFollowupSummary,
  getPendingFollowUpView,
} from "@/axios/perpanjangpaket/perpanjangpaket";
import { toProperCase } from "@/utils";
import LoaderCircle from "@/components/Loader-circle";
import SkeletionTable from "@/components/skeleton/Table";
import Card from "@/components/ui/Card";
import PaginationComponent from "@/components/globals/table/pagination";
import Table from "@/components/globals/table/table";
import Search from "@/components/globals/table/search";
import { DateTime } from "luxon";

const DashboardPerpanjangAdmin = () => {
  const { user_id, username, roles } = useSelector((state) => state.auth.data);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listData, setListData] = useState({ count: 0, results: [] });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async (page, size, query) => {
    try {
      const params = {
        page: page + 1,
        page_size: size,
        search: query,
        roles: "Admin",
      };

      const resPending = await getPendingFollowUpView({ params });

      setListData(resPending.data);
    } catch (err) {
      console.error("Failed to fetch followup summary:", err);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    loadSummary();
    fetchData(pageIndex, pageSize, searchQuery);
  }, [pageIndex, pageSize, searchQuery]);

  const handlePageChange = (page) => {
    setPageIndex(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPageIndex(0);
  };

  if (loading) return <LoaderCircle />;

  const COLUMNS = [
    {
      Header: "Pelatih",
      accessor: "trainer_nickname",
      size: 300,
      Cell: (row) => <span>{toProperCase(row?.cell?.value)}</span>,
    },
    {
      Header: "Siswa",
      accessor: "student_name",
      Cell: (row) => <span>{row?.cell?.value}</span>,
    },
    {
      Header: "Tanggal Follow Up",
      accessor: "in_progress_date",
      Cell: (row) => {
        return row?.cell?.value
          ? DateTime.fromISO(row?.cell?.value).toFormat("dd LLLL yyyy")
          : "-";
      },
    },
    {
      Header: "Nomor Wa",
      accessor: "student_phone",
      Cell: (row) => <span>{row?.cell?.value}</span>,
    },
  ];

  // helper untuk bikin statistik card
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
      <Card title="Siswa Follow Up">
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
    </div>
  );
};

export default DashboardPerpanjangAdmin;
