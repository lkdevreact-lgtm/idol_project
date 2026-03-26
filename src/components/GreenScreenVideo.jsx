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

    // Convert RGB to a simple "green-ness" measure
    float greenness = color.g - max(color.r, color.b);

    // Smoothstep to soft-edge the key
    float alpha = 1.0 - smoothstep(uThreshold - uSmoothing, uThreshold + uSmoothing, greenness);

    if (alpha < 0.01) discard;

    gl_FragColor = vec4(color.rgb, alpha);
  }
`;

export const GreenScreenVideo = ({ videoSrc, position, scale }) => {
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

    // Create and configure the video element
    const video = document.createElement("video");
    video.src = videoSrc;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = false;
    video.playsInline = true;
    video.autoplay = true;
    video.load();

    const texture = new VideoTexture(video);
    videoRef.current = video;
    textureRef.current = texture;

    video.play().catch((e) => console.warn("Video play error:", e));

    uniforms.uTexture.value = texture;
    if (meshRef.current) {
      meshRef.current.material.needsUpdate = true;
    }

    return () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
      texture.dispose();
    };
  }, [videoSrc, uniforms]);

  return (
    <mesh
      ref={meshRef}
      position={[-0.6,-0.5,-3]}
      scale={[1,2, 1]}
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
