// db.js
import { openDB } from "idb";

export const initDB = async () => {
  return openDB("MacoxDB", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("database")) {
        db.createObjectStore("database", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    },
  });
};

export const addItem = async (item) => {
  const db = await initDB();
  const tx = db.transaction("database", "readwrite");
  await tx.store.add(item);
  await tx.done;
};

export const getAllItems = async () => {
  const db = await initDB();
  return db.getAll("database");
};

export const updateItem = async (item) => {
  const db = await initDB();
  const tx = db.transaction("database", "readwrite");
  await tx.store.put(item);
  await tx.done;
};

export const deleteItem = async (id) => {
  const db = await initDB();
  const tx = db.transaction("database", "readwrite");
  await tx.store.delete(id);
  await tx.done;
};
