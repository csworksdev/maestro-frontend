export const RECRUITMENT_STAGE_DEFINITIONS = [
  {
    key: "cek-cv",
    title: "Cek CV",
    route: "cek-cv",
    order: 1,
    aliases: ["cek cv"],
  },
  {
    key: "interview-user",
    title: "Interview User",
    route: "interview-user",
    order: 2,
    aliases: ["interview user"],
  },
  {
    key: "validasi-video-renang",
    title: "Validasi Video Renang",
    route: "validasi-video-renang",
    order: 3,
    aliases: ["validasi video renang", "validasi view renang"],
  },
  {
    key: "interview-owner",
    title: "Interview Owner",
    route: "interview-owner",
    order: 4,
    aliases: ["interview owner"],
  },
  {
    key: "kontrak",
    title: "Kontrak",
    route: "kontrak",
    order: 5,
    aliases: ["kontrak"],
  },
];

export const RECRUITMENT_STAGE_ROUTES =
  RECRUITMENT_STAGE_DEFINITIONS.flatMap((stage) => [
    stage.route,
    `tahapan/${stage.route}`,
  ]);

const normalizeStageText = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const getRecruitmentStageDefinition = (stageKey) => {
  const normalizedKey = normalizeStageText(stageKey).replace(/\s+/g, "-");
  return (
    RECRUITMENT_STAGE_DEFINITIONS.find(
      (stage) => stage.key === normalizedKey || stage.route === normalizedKey,
    ) || RECRUITMENT_STAGE_DEFINITIONS[0]
  );
};

export const getStageName = (stage = {}) => {
  const safeStage = stage || {};
  return (
    safeStage.name ||
    safeStage.stage_name ||
    safeStage.recruitment_stage_name ||
    safeStage.current_stage_name ||
    ""
  );
};

export const getStageId = (stage = {}) => {
  const safeStage = stage || {};
  return (
    safeStage.stage_id ||
    safeStage.stage ||
    safeStage.id ||
    safeStage.recruitment_stage ||
    ""
  );
};

export const getStageOrder = (stage = {}) => {
  const safeStage = stage || {};
  const value =
    safeStage.stage_order ||
    safeStage.order ||
    safeStage.sort_order ||
    safeStage.sequence ||
    0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getStageNotes = (stage = {}) => {
  const safeStage = stage || {};
  return (
    safeStage.notes ||
    safeStage.note ||
    safeStage.catatan ||
    safeStage.description ||
    ""
  );
};

export const getStageStatus = (stage = {}) => {
  const safeStage = stage || {};
  return safeStage.status || safeStage.decision || safeStage.result || "";
};

export const getStageStatusDisplay = (
  stage = {},
  fallback = "Menunggu Diproses",
) => {
  const safeStage = stage || {};
  const stageName = getStageName(safeStage);
  const rawDisplay =
    safeStage.status_display ||
    safeStage.stage_status_display ||
    safeStage.current_stage_status_display ||
    "";
  const rawStatus = getStageStatus(safeStage);
  const normalizedStatus = String(rawDisplay || rawStatus)
    .trim()
    .toLowerCase();

  if (!normalizedStatus) return fallback;

  if (
    normalizedStatus.includes("tidak lulus") ||
    normalizedStatus.includes("gagal") ||
    normalizedStatus.includes("tolak") ||
    normalizedStatus.includes("reject") ||
    normalizedStatus.includes("failed")
  ) {
    return "Tidak Lulus";
  }

  if (
    normalizedStatus.includes("lulus") ||
    normalizedStatus.includes("approve") ||
    normalizedStatus.includes("diterima") ||
    normalizedStatus.includes("selesai") ||
    normalizedStatus.includes("passed")
  ) {
    return "Lulus";
  }

  if (
    normalizedStatus.includes("dalam proses") ||
    normalizedStatus.includes("in_progress") ||
    normalizedStatus.includes("proses") ||
    normalizedStatus.includes("process") ||
    normalizedStatus.includes("berjalan")
  ) {
    return stageName ? `Sedang ${stageName}` : "Sedang Diproses";
  }

  if (
    normalizedStatus.includes("pending") ||
    normalizedStatus.includes("menunggu") ||
    normalizedStatus.includes("submit") ||
    normalizedStatus.includes("baru")
  ) {
    return "Menunggu Diproses";
  }

  if (
    normalizedStatus.includes("jadwal") ||
    normalizedStatus.includes("schedule")
  ) {
    return stageName ? `Dijadwalkan ${stageName}` : "Dijadwalkan";
  }

  return rawDisplay || rawStatus || fallback;
};

export const getApplicationStages = (application = {}) => {
  const safeApplication = application || {};
  const stages =
    [
      safeApplication.stages,
      safeApplication.stage_processes,
      safeApplication.stage_histories,
      safeApplication.processes,
    ].find(Array.isArray) || [];

  if (stages.length) return stages;

  return safeApplication.current_stage ? [safeApplication.current_stage] : [];
};

export const sortStages = (stages = []) =>
  [...(Array.isArray(stages) ? stages : [])].sort((first, second) => {
    const firstOrder = getStageOrder(first);
    const secondOrder = getStageOrder(second);

    if (firstOrder !== secondOrder) return firstOrder - secondOrder;

    return String(first.created_at || "").localeCompare(
      String(second.created_at || ""),
    );
  });

export const getLatestApplicationStage = (application = {}) => {
  const stages = sortStages(getApplicationStages(application));
  return stages[stages.length - 1] || null;
};

export const stageMatchesDefinition = (stage, definition) => {
  if (!stage || !definition) return false;

  const order = getStageOrder(stage);
  if (order && order === definition.order) return true;

  const normalizedName = normalizeStageText(getStageName(stage));
  if (!normalizedName) return false;

  return definition.aliases.some(
    (alias) => normalizeStageText(alias) === normalizedName,
  );
};

export const findMasterStageForDefinition = (stages = [], definition) =>
  sortStages(stages).find((stage) => stageMatchesDefinition(stage, definition));

export const findNextStage = (stages = [], currentStage = null) => {
  const sorted = sortStages(stages);
  if (!sorted.length) return null;
  if (!currentStage) return sorted[0];

  const currentStageId = getStageId(currentStage);
  const currentOrder = getStageOrder(currentStage);
  const currentIndex = sorted.findIndex((stage) => {
    const stageId = getStageId(stage);
    if (currentStageId && stageId && currentStageId === stageId) return true;
    return currentOrder && getStageOrder(stage) === currentOrder;
  });

  if (currentIndex < 0) {
    const nextByOrder = sorted.find(
      (stage) => getStageOrder(stage) > currentOrder,
    );
    return nextByOrder || null;
  }

  return sorted[currentIndex + 1] || null;
};

export const isRejectedStage = (stage = {}) => {
  if (!stage) return false;

  const status = String(
    stage.status_display ||
      stage.stage_status_display ||
      stage.current_stage_status_display ||
      getStageStatus(stage),
  ).toLowerCase();

  return (
    status.includes("tidak lulus") ||
    status.includes("rejected") ||
    status.includes("reject") ||
    status.includes("ditolak") ||
    status.includes("tolak") ||
    status.includes("gagal") ||
    status.includes("failed")
  );
};
