import { create } from "zustand";

export const useLoadingStore = create((set) => ({
  isLoading: false,
  setLoading: (value) => set({ isLoading: Boolean(value) }),
}));

export const setLoading = (value) => {
  useLoadingStore.getState().setLoading(value);
};
