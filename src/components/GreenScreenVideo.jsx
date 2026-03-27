import { useEffect, useRef, useMemo } from "react";
import { VideoTexture, DoubleSide } from "three";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uThreshold;
  uniform float uSmoothing;
  varying vec2 vUv;

  void main() {
    vec4 color = texture2D(uTexture, vUv);

    // tránh frame đen lúc đầu
    if (color.r < 0.01 && color.g < 0.01 && color.b < 0.01) discard;

    // đo độ "xanh"
    float greenness = color.g - max(color.r, color.b);

    float alpha = 1.0 - smoothstep(
      uThreshold - uSmoothing,
      uThreshold + uSmoothing,
      greenness
    );

    if (alpha < 0.01) discard;

    gl_FragColor = vec4(color.rgb, alpha);
  }
`;

export const GreenScreenVideo = ({ videoSrc }) => {
  const meshRef = useRef();
  const videoRef = useRef();
  const textureRef = useRef();

  const uniforms = useMemo(
    () => ({
      uTexture: { value: null },
      uThreshold: { value: 0.35 },
      uSmoothing: { value: 0.08 },
    }),
    []
  );

  useEffect(() => {
    if (!videoSrc) return;

    // tạo video
    const video = document.createElement("video");
    video.src = videoSrc;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = false; // QUAN TRỌNG
    video.playsInline = true;
    video.preload = "auto";

    const texture = new VideoTexture(video);

    videoRef.current = video;
    textureRef.current = texture;

    // ẩn mesh trước khi load xong
    if (meshRef.current) {
      meshRef.current.visible = false;
    }

    // khi video có frame đầu
    const handleLoaded = () => {
      video.play().catch(() => {});

      uniforms.uTexture.value = texture;

      if (meshRef.current) {
        meshRef.current.visible = true;
        meshRef.current.material.needsUpdate = true;
      }
    };

    video.addEventListener("loadeddata", handleLoaded);

    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.removeEventListener("loadeddata", handleLoaded);

      texture.dispose();
    };
  }, [videoSrc, uniforms]);

  return (
    <mesh
      ref={meshRef}
      position={[-0.6, -0.5, -3]}
      scale={[1, 2, 1]}
    >
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        side={DoubleSide}
        uniforms={uniforms}
      />
    </mesh>
  );
};