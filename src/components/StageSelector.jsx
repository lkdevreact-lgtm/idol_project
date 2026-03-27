import { useStageStore } from "../hooks/useStageStore";
import { useState } from "react";

const STAGES = [
  { id: "stage", name: "Default Stage", path: "models/stage-ga.glb" },
  { id: "stage-1", name: "Stage 1", path: "models/stage-1.glb" },
  { id: "stage-2", name: "Stage 2", path: "models/stage-4.glb" },
];

const DEFAULT_CONFIG = { x: -0.1, z: -1.4, y: 0, scale: 0.3 };

export const StageSelector = () => {
  const { selectedStage, setSelectedStage, stageConfigs, updateStageConfig } = useStageStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentConfig = stageConfigs[selectedStage] || DEFAULT_CONFIG;

  const handleConfigChange = (key, value) => {
    updateStageConfig(selectedStage, { [key]: parseFloat(value) || 0 });
  };

  return (
    <>
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white/80 hover:bg-white text-gray-800 font-semibold py-2 px-4 rounded-full shadow-lg transition-all backdrop-blur-sm"
        >
          {isOpen ? "Close Backgrounds" : "Change Background"}
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-16 right-4 z-20 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl w-64 max-h-[70vh] overflow-y-auto">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Select Stage</h3>
          <div className="flex flex-col gap-2">
            {STAGES.map((stage) => (
              <button
                key={stage.id}
                onClick={() => setSelectedStage(stage.path)}
                className={`py-2 px-4 rounded-lg text-sm text-left transition-colors ${
                  selectedStage === stage.path
                    ? "bg-blue-500 text-white font-medium"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {stage.name}
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold mb-2 text-gray-700">Adjust Current Stage</h4>
            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-between text-xs text-gray-600">
                Position X
                <input
                  type="number"
                  step="0.1"
                  value={currentConfig.x}
                  onChange={(e) => handleConfigChange("x", e.target.value)}
                  className="w-16 p-1 bg-white border border-gray-300 rounded text-center"
                />
              </label>
              <label className="flex items-center justify-between text-xs text-gray-600">
                Position Z
                <input
                  type="number"
                  step="0.1"
                  value={currentConfig.z}
                  onChange={(e) => handleConfigChange("z", e.target.value)}
                  className="w-16 p-1 bg-white border border-gray-300 rounded text-center"
                />
              </label>
              <label className="flex items-center justify-between text-xs text-gray-600">
                Position Y
                <input
                  type="number"
                  step="0.1"
                  value={currentConfig.y}
                  onChange={(e) => handleConfigChange("y", e.target.value)}
                  className="w-16 p-1 bg-white border border-gray-300 rounded text-center"
                />
              </label>
              <label className="flex items-center justify-between text-xs text-gray-600">
                Scale
                <input
                  type="number"
                  step="0.05"
                  value={currentConfig.scale}
                  onChange={(e) => handleConfigChange("scale", e.target.value)}
                  className="w-16 p-1 bg-white border border-gray-300 rounded text-center"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
