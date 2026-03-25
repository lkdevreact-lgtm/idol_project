import { Camera } from "@mediapipe/camera_utils";

import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import {
  FACEMESH_TESSELATION,
  HAND_CONNECTIONS,
  Holistic,
  POSE_CONNECTIONS,
} from "@mediapipe/holistic";
import { useEffect, useRef, useState } from "react";
import { useVideoRecognition } from "../hooks/useVideoRecognition";

export const CameraWidget = () => {
  const [start, setStart] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const videoElement = useRef();
  const drawCanvas = useRef();
  const fileInputRef = useRef();
  const animFrameRef = useRef();
  const holisticRef = useRef();
  const setVideoElement = useVideoRecognition((state) => state.setVideoElement);

  const drawResults = (results) => {
    drawCanvas.current.width = videoElement.current.videoWidth;
    drawCanvas.current.height = videoElement.current.videoHeight;
    let canvasCtx = drawCanvas.current.getContext("2d");
    canvasCtx.save();
    canvasCtx.clearRect(
      0,
      0,
      drawCanvas.current.width,
      drawCanvas.current.height
    );
    // Use `Mediapipe` drawing functions
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
      color: "#00cff7",
      lineWidth: 4,
    });
    drawLandmarks(canvasCtx, results.poseLandmarks, {
      color: "#ff0364",
      lineWidth: 2,
    });
    drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION, {
      color: "#C0C0C070",
      lineWidth: 1,
    });
    if (results.faceLandmarks && results.faceLandmarks.length === 478) {
      //draw pupils
      drawLandmarks(
        canvasCtx,
        [results.faceLandmarks[468], results.faceLandmarks[468 + 5]],
        {
          color: "#ffe603",
          lineWidth: 2,
        }
      );
    }
    drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, {
      color: "#eb1064",
      lineWidth: 5,
    });
    drawLandmarks(canvasCtx, results.leftHandLandmarks, {
      color: "#00cff7",
      lineWidth: 2,
    });
    drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, {
      color: "#22c3e3",
      lineWidth: 5,
    });
    drawLandmarks(canvasCtx, results.rightHandLandmarks, {
      color: "#ff0364",
      lineWidth: 2,
    });
  };

  // Khởi tạo Holistic một lần và lưu vào ref
  const initHolistic = () => {
    const holistic = new Holistic({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1635989137/${file}`;
      },
    });
    holistic.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
      refineFaceLandmarks: true,
    });
    holistic.onResults((results) => {
      drawResults(results);
      useVideoRecognition.getState().resultsCallback?.(results);
    });
    holisticRef.current = holistic;
    return holistic;
  };

  // useEffect cho webcam (giữ nguyên logic gốc)
  useEffect(() => {
    if (!start || videoFile) return;
    if (useVideoRecognition.getState().videoElement) return;

    setVideoElement(videoElement.current);
    const holistic = initHolistic();

    const camera = new Camera(videoElement.current, {
      onFrame: async () => {
        await holistic.send({ image: videoElement.current });
      },
      width: 640,
      height: 480,
    });
    camera.start();

    return () => {
      camera.stop?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, videoFile]);

  // useEffect cho video file – dùng requestAnimationFrame để loop frame
  useEffect(() => {
    if (!start || !videoFile) return;

    setVideoElement(videoElement.current);
    const holistic = initHolistic();

    const videoEl = videoElement.current;
    videoEl.src = videoFile;
    videoEl.loop = true;
    videoEl.muted = true;
    videoEl.play();

    let running = true;

    const processFrame = async () => {
      if (!running) return;
      if (videoEl.readyState >= 2) {
        await holistic.send({ image: videoEl });
      }
      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    videoEl.onloadeddata = () => {
      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
      videoEl.pause();
      videoEl.src = "";
      videoEl.onloadeddata = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, videoFile]);

  // Reset khi tắt
  useEffect(() => {
    if (!start) {
      setVideoElement(null);
      cancelAnimationFrame(animFrameRef.current);
      if (videoElement.current) {
        videoElement.current.pause();
        videoElement.current.src = "";
      }
    }
  }, [start, setVideoElement]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoFile(url);
    setStart(true);
  };

  const handleToggleCamera = () => {
    setVideoFile(null);
    setStart((prev) => !prev);
  };

  return (
    <>
      {/* Nút upload video */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="fixed bottom-4 right-20 cursor-pointer bg-purple-500 hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center z-20 p-4 rounded-full text-white drop-shadow-sm"
        title="Upload video file"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
          />
        </svg>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp4,.webm"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Nút bật/tắt webcam */}
      <button
        onClick={handleToggleCamera}
        className={`fixed bottom-4 right-4 cursor-pointer ${
          start && !videoFile
            ? "bg-red-500 hover:bg-red-700"
            : "bg-indigo-400 hover:bg-indigo-700"
        } transition-colors duration-200 flex items-center justify-center z-20 p-4 rounded-full text-white drop-shadow-sm`}
      >
        {!start || videoFile ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 0 1-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 0 0-2.25-2.25h-9c-.621 0-1.184.252-1.591.659m12.182 12.182L2.909 5.909M1.5 4.5l1.409 1.409"
            />
          </svg>
        )}
      </button>

      {/* Khung hiển thị video + canvas */}
      <div
        className={`absolute z-[999999] bottom-24 right-4 w-[320px] h-[240px] rounded-[20px] overflow-hidden ${
          !start ? "hidden" : ""
        }`}
        width={640}
        height={480}
      >
        <canvas
          ref={drawCanvas}
          className="absolute z-10 w-full h-full bg-black/50 top-0 left-0"
        />
        <video
          ref={videoElement}
          className="absolute z-0 w-full h-full top-0 left-0"
        />
      </div>
    </>
  );
};
