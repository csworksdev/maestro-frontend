import { deleteDB, openDB } from "idb";

const DATABASE_NAME = "maestro-cek-jadwal";
const DATABASE_VERSION = 2;
const STORE_NAME = "schedule-responses";
const CACHE_SCHEMA_VERSION = 2;
const MAX_CACHE_AGE_MS = 14 * 24 * 60 * 60 * 1000;

const SCHEDULE_FIELDS = new Set([
  "trainer_id",
  "trainerId",
  "fullname",
  "full_name",
  "nickname",
  "contract_type_display",
  "contractTypeDisplay",
  "contract_type",
  "contractType",
  "is_fulltime",
  "gender",
  "kolam",
  "total_order",
  "percent",
  "is_paid",
  "datahari",
  "hari",
  "data",
  "jam",
  "orders",
  "is_free",
  "order_id",
  "orderId",
  "id",
  "student",
  "students",
  "fullname",
  "full_name",
  "name",
  "student_name",
  "nickname",
  "product",
  "product_name",
  "pool_name",
  "p",
  "meet",
  "tgl",
  "admin",
  "frequency_per_week",
  "is_pending_reschedule",
  "status",
]);

const COMPLETED_FIELDS = new Set([
  ...SCHEDULE_FIELDS,
  "trainer_uuid",
  "coach_id",
  "trainer",
  "trainer_name",
  "trainerName",
  "time",
  "start_time",
  "startTime",
  "schedule_time",
  "scheduleTime",
  "order_time",
  "orderTime",
  "hour",
  "siswa",
  "student_names",
  "studentNames",
  "studentName",
  "paket",
  "package_name",
  "completed_date",
  "finish_date",
  "end_date",
  "last_meet_date",
  "schedules",
  "completed_schedule",
  "completedSchedule",
  "completed_schedules",
  "completedSchedules",
  "order_schedules",
  "orderSchedules",
  "meetings",
  "order_meetings",
  "orderMeetings",
  "date",
  "meet_date",
  "meeting_date",
  "training_date",
  "order_date",
  "orderDate",
  "created_at",
  "createdAt",
  "order",
  "last_training_date",
  "lastTrainingDate",
  "lastMeetDate",
  "last_presence_date",
  "lastPresenceDate",
]);

let databasePromise;

const getDatabase = () => {
  if (typeof indexedDB === "undefined") return null;

  if (!databasePromise) {
    databasePromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
      upgrade(database, oldVersion, _newVersion, transaction) {
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, {
            keyPath: "key",
          });
          store.createIndex("savedAt", "savedAt");
        } else if (oldVersion < DATABASE_VERSION) {
          // Cache versi lama belum terisolasi per pengguna dan harus dibuang.
          transaction.objectStore(STORE_NAME).clear();
        }
      },
      blocking() {
        databasePromise?.then((database) => database.close());
        databasePromise = undefined;
      },
    });
  }

  return databasePromise;
};

const normalizeKeyPart = (value) =>
  encodeURIComponent(String(value ?? "").trim().toLowerCase());

export const createScheduleOwnerScope = ({ userId, tenantId }) => {
  if (!userId) return "";
  return [tenantId || "default", userId].map(normalizeKeyPart).join("::");
};

export const createScheduleCacheKey = ({ owner, type, branch, pool, day }) => {
  if (!owner) return "";
  return [owner, type, branch, pool, day].map(normalizeKeyPart).join("::");
};

const isDynamicTimeKey = (key) => /^\d{1,2}([:.]\d{2})?$/.test(key);

const sanitizeValue = (value, allowedFields) => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, allowedFields));
  }

  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => allowedFields.has(key) || isDynamicTimeKey(key))
      .map(([key, nestedValue]) => [
        key,
        sanitizeValue(nestedValue, allowedFields),
      ]),
  );
};

export const sanitizeScheduleCacheData = (data, type = "schedule") =>
  sanitizeValue(
    data,
    type === "completed" ? COMPLETED_FIELDS : SCHEDULE_FIELDS,
  );

export const readScheduleCache = async (key, owner) => {
  if (!key || !owner) return null;

  try {
    const database = await getDatabase();
    if (!database) return null;

    const entry = await database.get(STORE_NAME, key);
    if (
      !entry ||
      entry.schemaVersion !== CACHE_SCHEMA_VERSION ||
      entry.owner !== owner
    ) {
      if (entry) await database.delete(STORE_NAME, key);
      return null;
    }

    if (Date.now() - entry.savedAt > MAX_CACHE_AGE_MS) {
      await database.delete(STORE_NAME, key);
      return null;
    }

    return entry;
  } catch (error) {
    console.warn("IndexedDB jadwal tidak dapat dibaca:", error);
    return null;
  }
};

export const writeScheduleCache = async ({
  key,
  owner,
  type,
  data,
  etag,
  updatedAt,
}) => {
  if (!key || !owner) return;

  try {
    const database = await getDatabase();
    if (!database) return;

    await database.put(STORE_NAME, {
      key,
      owner,
      type,
      data: sanitizeScheduleCacheData(data, type),
      etag: etag || null,
      updatedAt: updatedAt || new Date().toISOString(),
      savedAt: Date.now(),
      schemaVersion: CACHE_SCHEMA_VERSION,
    });
  } catch (error) {
    console.warn("IndexedDB jadwal tidak dapat diperbarui:", error);
  }
};

export const clearScheduleCache = async () => {
  try {
    if (databasePromise) {
      const database = await databasePromise;
      database.close();
      databasePromise = undefined;
    }
    if (typeof indexedDB !== "undefined") await deleteDB(DATABASE_NAME);
  } catch (error) {
    console.warn("IndexedDB jadwal tidak dapat dibersihkan:", error);
  }
};

export const pruneScheduleCache = async () => {
  try {
    const database = await getDatabase();
    if (!database) return;

    const transaction = database.transaction(STORE_NAME, "readwrite");
    const index = transaction.store.index("savedAt");
    let cursor = await index.openCursor(
      IDBKeyRange.upperBound(Date.now() - MAX_CACHE_AGE_MS),
    );

    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }

    await transaction.done;
  } catch (error) {
    console.warn("IndexedDB jadwal tidak dapat dibersihkan:", error);
  }
};
