import { create } from "zustand";

export const useStageStore = create((set) => ({
  selectedStage: "models/stage-ga.glb",
  stageConfigs: {}, // Maps stage path -> { x, z, scale }
  setSelectedStage: (stagePath) => set({ selectedStage: stagePath }),
  updateStageConfig: (stagePath, config) =>
    set((state) => ({
      stageConfigs: {
        ...state.stageConfigs,
        [stagePath]: {
          ...(state.stageConfigs[stagePath] || { x: -0.1, z: -1.4, y: 0, scale: 0.3 }),
          ...config,
        },
      },
    })),
}));
