import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Loading from "@/components/Loading";
import Search from "@/components/globals/table/search";
import Table from "@/components/globals/table/table";
import TableAction from "@/components/globals/table/tableAction";
import PaginationComponent from "@/components/globals/table/pagination";
import { getApplicationsAll } from "@/axios/career/application";
import {
  getApplicationStages,
  getStageId,
  getLatestApplicationStage,
  getRecruitmentStageDefinition,
  getStageName,
  getStageOrder,
  getStageNotes,
  getStageStatus,
  getStageStatusDisplay,
  isRejectedStage,
  stageMatchesDefinition,
} from "./stageConfig";
import { getDepartmentStages, processApplicationStage } from "./stageProcess";

const getErrorMessage = (error) =>
  error?.response?.data?.detail ||
  error?.response?.data?.message ||
  error?.message ||
  "Gagal memproses tahapan pelamar.";

const getStageBadgeMeta = (value = "") => {
  const status = String(value).trim().toLowerCase();

  if (
    status.includes("tidak lulus") ||
    status.includes("gagal") ||
    status.includes("tolak") ||
    status.includes("reject") ||
    status.includes("failed")
  ) {
    return {
      className:
        "bg-rose-100 text-rose-800 ring-rose-200 shadow-sm dark:bg-rose-500/20 dark:text-rose-100 dark:ring-rose-400/30",
      icon: "heroicons-outline:x-circle",
    };
  }

  if (
    status.includes("lulus") ||
    status.includes("approve") ||
    status.includes("diterima") ||
    status.includes("selesai") ||
    status.includes("passed")
  ) {
    return {
      className:
        "bg-emerald-100 text-emerald-800 ring-emerald-200 shadow-sm dark:bg-emerald-500/20 dark:text-emerald-100 dark:ring-emerald-400/30",
      icon: "heroicons-outline:check-circle",
    };
  }

  if (
    status.includes("proses") ||
    status.includes("sedang") ||
    status.includes("diproses") ||
    status.includes("process") ||
    status.includes("berjalan")
  ) {
    return {
      className:
        "bg-amber-100 text-amber-900 ring-amber-200 shadow-sm dark:bg-amber-500/20 dark:text-amber-100 dark:ring-amber-400/30",
      icon: "heroicons-outline:clock",
    };
  }

  if (
    status.includes("pending") ||
    status.includes("menunggu") ||
    status.includes("submit") ||
    status.includes("baru")
  ) {
    return {
      className:
        "bg-sky-100 text-sky-800 ring-sky-200 shadow-sm dark:bg-sky-500/20 dark:text-sky-100 dark:ring-sky-400/30",
      icon: "heroicons-outline:document-text",
    };
  }

  if (
    status.includes("jadwal") ||
    status.includes("dijadwalkan") ||
    status.includes("schedule")
  ) {
    return {
      className:
        "bg-violet-100 text-violet-800 ring-violet-200 shadow-sm dark:bg-violet-500/20 dark:text-violet-100 dark:ring-violet-400/30",
      icon: "heroicons-outline:calendar",
    };
  }

  return {
    className:
      "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-700/60 dark:text-slate-200 dark:ring-slate-600",
    icon: "heroicons-outline:information-circle",
  };
};

const RecruitmentBadge = ({
  children,
  className = "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-700/60 dark:text-slate-200 dark:ring-slate-600",
  icon,
}) => (
  <span
    className={`inline-flex max-w-full items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-center text-[11px] font-semibold leading-4 ring-1 ${className}`}
  >
    {icon ? (
      <Icon icon={icon} className="h-3.5 w-3.5 flex-none" />
    ) : null}
    <span className="min-w-0 break-words">{children}</span>
  </span>
);

const CenterCell = ({ children }) => (
  <div className="flex min-w-0 justify-center text-center">{children}</div>
);

const StatusBadge = ({ stage }) => {
  const displayStatus = getStageStatusDisplay(stage);
  const stageBadge = getStageBadgeMeta(
    `${displayStatus} ${getStageStatus(stage) || ""}`,
  );

  return (
    <RecruitmentBadge className={stageBadge.className} icon={stageBadge.icon}>
      {displayStatus}
    </RecruitmentBadge>
  );
};

const CvLink = ({ href }) => {
  if (!href) {
    return (
      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
        -
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1.5 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-100 transition hover:bg-sky-100 hover:text-sky-800 dark:bg-sky-500/10 dark:text-sky-200 dark:ring-sky-500/20 dark:hover:bg-sky-500/20"
    >
      <Icon icon="heroicons-outline:document-text" className="h-3.5 w-3.5" />
      <span>CV</span>
    </a>
  );
};

const RecruitmentStagePage = ({ stageKey }) => {
  const params = useParams();
  const navigate = useNavigate();
  const activeStage = getRecruitmentStageDefinition(stageKey || params.stageKey);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [applications, setApplications] = useState([]);
  const [masterStagesByDepartment, setMasterStagesByDepartment] = useState({});
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  const fetchData = async (query = search) => {
    try {
      setIsLoading(true);
      const response = await getApplicationsAll({
        page: 1,
        page_size: 100,
        search: query,
        ordering: "-id",
      });
      const results = response?.data?.results || [];
      const departmentIds = [
        ...new Set(
          results
            .flatMap((application) => [
              application?.department,
              application?.department_id,
              ...getApplicationStages(application).map(
                (stage) => stage?.department || stage?.department_id,
              ),
            ])
            .filter(Boolean),
        ),
      ];
      const stageEntries = await Promise.all(
        departmentIds.map(async (departmentId) => [
          departmentId,
          await getDepartmentStages(departmentId),
        ]),
      );

      setApplications(results);
      setMasterStagesByDepartment(Object.fromEntries(stageEntries));
    } catch (error) {
      console.error("Error fetching stage applications", error);
      Swal.fire("Error!", "Gagal mengambil data tahapan.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(search);
  }, [activeStage.key]);

  const stageApplications = useMemo(
    () =>
      applications
        .map((application) => {
          const latestStage = getLatestApplicationStage(application);
          const departmentId =
            application?.department ||
            application?.department_id ||
            latestStage?.department ||
            latestStage?.department_id;
          const masterStage = (
            masterStagesByDepartment[departmentId] || []
          ).find((stage) => getStageId(stage) === getStageId(latestStage));
          const enrichedStage = latestStage
            ? {
                ...masterStage,
                ...latestStage,
                name: getStageName(latestStage) || getStageName(masterStage),
                stage_order:
                  getStageOrder(latestStage) || getStageOrder(masterStage),
              }
            : null;

          return {
            ...application,
            latest_stage: enrichedStage,
            stages_count: getApplicationStages(application).length,
          };
        })
        .filter((application) =>
          stageMatchesDefinition(application.latest_stage, activeStage),
        ),
    [applications, activeStage, masterStagesByDepartment],
  );

  const paginatedApplications = useMemo(() => {
    const start = pageIndex * pageSize;
    return stageApplications.slice(start, start + pageSize);
  }, [pageIndex, pageSize, stageApplications]);

  const handleSearch = (query) => {
    setSearch(query);
    setPageIndex(0);
    fetchData(query);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPageIndex(0);
  };

  const handleDetail = (application) => {
    navigate(`/rekruitmen/detail/${application.application_id}`, {
      state: { data: application },
    });
  };

  const handleDecision = async (application, status) => {
    const isApproved = status === "approved";
    const result = await Swal.fire({
      title: isApproved ? "Approve ke tahap selanjutnya?" : "Tolak pelamar?",
      input: "textarea",
      inputLabel: "Catatan tahapan (opsional)",
      inputPlaceholder: "Tambahkan catatan bila diperlukan",
      inputValue: getStageNotes(application.latest_stage),
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: isApproved ? "#22c55e" : "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: isApproved ? "Approve" : "Tolak",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      setIsProcessing(true);
      await processApplicationStage({
        application,
        status,
        notes: result.value?.trim() || "",
      });
      Swal.fire("Berhasil!", "Tahapan pelamar berhasil diproses.", "success");
      fetchData();
    } catch (error) {
      Swal.fire("Error!", getErrorMessage(error), "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const actions = [
    {
      name: "Detail",
      icon: "heroicons-outline:eye",
      className: "!h-8 !w-8 !rounded-lg",
      onClick: (row) => handleDetail(row.row.original),
    },
    {
      name: "Approve",
      icon: "heroicons-outline:check-circle",
      className: "!h-8 !w-8 !rounded-lg",
      onClick: (row) => handleDecision(row.row.original, "approved"),
    },
    {
      name: "Tolak",
      icon: "heroicons-outline:x-circle",
      className: "!h-8 !w-8 !rounded-lg",
      onClick: (row) => handleDecision(row.row.original, "rejected"),
    },
  ];

  const columns = [
    {
      Header: "Nama",
      accessor: "name",
      Cell: (row) => (
        <CenterCell>
          <div className="min-w-0">
            <div className="break-words font-semibold text-slate-900 dark:text-white">
              {row?.cell?.value || "-"}
            </div>
            <div className="break-words text-[10px] leading-4 text-slate-500">
              {row?.row?.original?.email || "-"}
            </div>
          </div>
        </CenterCell>
      ),
    },
    {
      Header: "Loker",
      accessor: "job_title",
      Cell: (row) => (
        <CenterCell>
          <span className="break-words text-slate-700 dark:text-slate-200">
            {row?.cell?.value || "-"}
          </span>
        </CenterCell>
      ),
    },
    {
      Header: "Cabang",
      accessor: "branch_name",
      Cell: (row) => (
        <CenterCell>
          <RecruitmentBadge className="bg-cyan-50 text-cyan-700 ring-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-200 dark:ring-cyan-500/20">
            {row?.cell?.value || "-"}
          </RecruitmentBadge>
        </CenterCell>
      ),
    },
    ...(activeStage.key === "cek-cv"
      ? [
          {
            Header: "File CV",
            accessor: "upload_cv",
            Cell: (row) => (
              <CenterCell>
                <CvLink href={row?.cell?.value} />
              </CenterCell>
            ),
          },
        ]
      : []),
    {
      Header: "Tahap",
      accessor: "latest_stage",
      Cell: (row) => (
        <CenterCell>
          <div className="min-w-0 space-y-1">
            <div className="break-words font-semibold text-slate-700 dark:text-slate-200">
              {getStageName(row?.cell?.value) || activeStage.title}
            </div>
            <StatusBadge stage={row?.cell?.value} />
          </div>
        </CenterCell>
      ),
    },
    {
      Header: "Catatan",
      accessor: "latest_stage_notes",
      Cell: (row) => (
        <CenterCell>
          <span className="line-clamp-2 break-words text-[11px] leading-4 text-slate-500">
            {getStageNotes(row?.row?.original?.latest_stage) || "-"}
          </span>
        </CenterCell>
      ),
    },
    {
      Header: "Action",
      accessor: "action",
      id: "action",
      sticky: "right",
      Cell: (row) => {
        const rowActions = isRejectedStage(row?.row?.original?.latest_stage)
          ? [actions[0]]
          : actions;

        return (
          <div className="flex justify-center gap-1">
            {rowActions.map((action, index) => (
              <TableAction
                key={action.id || index}
                action={action}
                row={row}
              />
            ))}
          </div>
        );
      },
    },
  ];

  const pageCount = Math.ceil(stageApplications.length / pageSize);

  return (
    <Card
      title={activeStage.title}
      subtitle={`Daftar pelamar pada tahap ${activeStage.title}`}
      bodyClass="p-4"
      headerslot={
        <Button
          text="Refresh"
          type="button"
          className="bg-slate-100 text-slate-700"
          icon="heroicons-outline:arrow-path"
          disabled={isLoading || isProcessing}
          onClick={() => fetchData()}
        />
      }
    >
      <div className="mb-3 max-w-xl">
        <Search
          searchValue={search}
          handleSearch={handleSearch}
          isLoading={isLoading}
          placeholder="Cari pelamar"
          align="left"
        />
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <Table
            tableId={`tahapan-${activeStage.key}`}
            listData={{
              count: stageApplications.length,
              results: paginatedApplications,
            }}
            listColumn={columns}
            searchValue={search}
            handleSearch={handleSearch}
            density="tight"
            showDensityControl={false}
            allowHorizontalScroll={false}
            actionColumnClassName="w-28 min-w-[7rem]"
          />
          <PaginationComponent
            pageSize={pageSize}
            pageIndex={pageIndex}
            pageCount={pageCount}
            canPreviousPage={pageIndex > 0}
            canNextPage={pageIndex < pageCount - 1}
            gotoPage={setPageIndex}
            previousPage={() => setPageIndex(pageIndex - 1)}
            nextPage={() => setPageIndex(pageIndex + 1)}
            setPageSize={handlePageSizeChange}
          />
        </>
      )}
    </Card>
  );
};

export default RecruitmentStagePage;
