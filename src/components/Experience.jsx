import { CameraControls, Environment, Gltf } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useControls } from "leva";
import { useRef } from "react";
import { VRMAvatar } from "./VRMAvatar";

export const Experience = () => {
  const controls = useRef();

  const { avatar } = useControls("VRM", {
    avatar: {
      value: "3859814441197244330.vrm",
      options: [
        "262410318834873893.vrm",
        "3859814441197244330.vrm",
        "3636451243928341470.vrm",
        "8087383217573817818.vrm",
        "untitled.vrm"
        
      ],
    },
  });

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
      <group position-y={-1.25}>
        <VRMAvatar avatar={avatar} />
        <Gltf
          src="models/stage-1.glb"
          position-z={-0.1}
          position-x={-0.2}
          position-y={-0.35}
          scale={0.65}
        />
         <Gltf
          src="models/micro.glb"
          position-z={0.35}
          position-x={-0.96}
          position-y={-0.3}
          rotation={[0, Math.PI, 0]}
          scale={0.094}
        />
      </group>
      <EffectComposer>
        <Bloom mipmapBlur intensity={0.7} />
      </EffectComposer>
    </>
  );
};
