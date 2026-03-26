import { create } from "zustand";

export const useVideoStore = create((set) => ({
  selectedVideo: null,
  selectedSound: null,
  setSelected: (video, sound) => set({ selectedVideo: video, selectedSound: sound }),
  // backward-compat
  setSelectedVideo: (path) => set({ selectedVideo: path }),
}));
