import { CameraControls, Environment, Gltf } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useRef } from "react";
import { GreenScreenVideo } from "./GreenScreenVideo";
import {useVideoStore} from "../hooks/useVideoStore"
import { useStageStore } from "../hooks/useStageStore";
import { BlackScreenVideo } from "./BlackScreenVideo";

export const Experience = () => {
  const controls = useRef();
  const selectedVideo = useVideoStore((s) => s.selectedVideo);
  const selectedStage = useStageStore((s) => s.selectedStage);
  const stageConfigs = useStageStore((s) => s.stageConfigs);

  const currentConfig = stageConfigs[selectedStage] || { x: -0.5, z: -1.4, y: 0, scale: 0.65 };

  return (
    <>
      <CameraControls
        ref={controls}
        maxPolarAngle={Math.PI / 2}
        minDistance={1}
        maxDistance={10}
      />
      <Environment preset="sunset" />
      <directionalLight intensity={2} position={[10, 10, 5]} />
      <directionalLight intensity={1} position={[-10, 10, 5]} />
      <group position-y={-1.4} position-x={-0.5} position-z={-3}>
        <Gltf
          src={selectedStage}
          position-z={currentConfig.z}
          position-x={currentConfig.x}
          position-y={currentConfig.y}
          scale={currentConfig.scale}
        />
      </group>

      {/* Green screen video plane — shows when a video is selected */}
      {selectedVideo && (
        <GreenScreenVideo
          videoSrc={selectedVideo}
          position={[0, 0.6, -0.8]}
          scale={[2.4, 1.35, 1]}
        />
      )}

      {/* <EffectComposer>
        <Bloom mipmapBlur intensity={0.7} />
      </EffectComposer> */}
    </>
  );
};
