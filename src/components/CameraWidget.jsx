import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import {
  FACEMESH_TESSELATION,
  HAND_CONNECTIONS,
  Holistic,
  POSE_CONNECTIONS,
} from "@mediapipe/holistic";
import { useEffect, useRef, useState, useCallback } from "react";
import { useVideoRecognition } from "../hooks/useVideoRecognition";

// Mode constants
const MODE_IDLE = "idle";
const MODE_WEBCAM = "webcam";
const MODE_VIDEO = "video";

export const CameraWidget = () => {
  const [mode, setMode] = useState(MODE_IDLE); // "idle" | "webcam" | "video"
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState(null);

  const videoElement = useRef(null);
  const uploadedVideoEl = useRef(null);
  const drawCanvas = useRef(null);
  const fileInputRef = useRef(null);

  // Internal refs to manage cleanup without re-renders
  const holisticRef = useRef(null);
  const cameraRef = useRef(null);
  const rafIdRef = useRef(null);
  const isProcessingRef = useRef(false);

  const setVideoElement = useVideoRecognition((state) => state.setVideoElement);

  // ─── Draw helpers ────────────────────────────────────────────────────────────
  const drawResults = useCallback((results, sourceEl) => {
    if (!drawCanvas.current || !sourceEl) return;
    drawCanvas.current.width = sourceEl.videoWidth || 640;
    drawCanvas.current.height = sourceEl.videoHeight || 480;
    const canvasCtx = drawCanvas.current.getContext("2d");
    canvasCtx.save();
    canvasCtx.clearRect(
      0,
      0,
      drawCanvas.current.width,
      drawCanvas.current.height,
    );

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
      drawLandmarks(
        canvasCtx,
        [results.faceLandmarks[468], results.faceLandmarks[473]],
        { color: "#ffe603", lineWidth: 2 },
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
    canvasCtx.restore();
  }, []);

  // ─── Cleanup function ─────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    // Stop RAF loop
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    // Stop MediaPipe Camera (webcam)
    if (cameraRef.current) {
      try {
        cameraRef.current.stop();
      } catch (_) {}
      cameraRef.current = null;
    }
    // Close holistic
    if (holisticRef.current) {
      try {
        holisticRef.current.close();
      } catch (_) {}
      holisticRef.current = null;
    }
    isProcessingRef.current = false;
    setVideoElement(null);
  }, [setVideoElement]);

  // ─── Build a fresh Holistic instance ─────────────────────────────────────────
  const buildHolistic = useCallback(
    (sourceEl) => {
      const holistic = new Holistic({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1635989137/${file}`,
      });
      holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
        refineFaceLandmarks: true,
      });
      holistic.onResults((results) => {
        drawResults(results, sourceEl);
        useVideoRecognition.getState().resultsCallback?.(results);
        isProcessingRef.current = false;
      });
      return holistic;
    },
    [drawResults],
  );

  // ─── Effect: handle mode transitions ─────────────────────────────────────────
  useEffect(() => {
    if (mode === MODE_IDLE) {
      cleanup();
      return;
    }

    if (mode === MODE_WEBCAM) {
      cleanup(); // ensure clean state first
      const el = videoElement.current;
      if (!el) return;

      setVideoElement(el);
      const holistic = buildHolistic(el);
      holisticRef.current = holistic;

      const camera = new Camera(el, {
        onFrame: async () => {
          if (!isProcessingRef.current && holisticRef.current) {
            isProcessingRef.current = true;
            await holisticRef.current.send({ image: el });
          }
        },
        width: 640,
        height: 480,
      });
      cameraRef.current = camera;
      camera.start();
      return;
    }

    if (mode === MODE_VIDEO) {
      cleanup(); // ensure clean state first

      // Wait for the uploaded video element to be ready
      const waitForVideo = () => {
        const el = uploadedVideoEl.current;
        if (!el || !uploadedVideoUrl) return;

        setVideoElement(el);
        const holistic = buildHolistic(el);
        holisticRef.current = holistic;

        const processFrame = async () => {
          if (!el.paused && !el.ended && holisticRef.current) {
            if (!isProcessingRef.current) {
              isProcessingRef.current = true;
              await holisticRef.current.send({ image: el });
            }
          }
          rafIdRef.current = requestAnimationFrame(processFrame);
        };

        el.onloadeddata = () => {
          el.play();
          processFrame();
        };

        // If already loaded
        if (el.readyState >= 2) {
          el.play();
          processFrame();
        }
      };

      const timer = setTimeout(waitForVideo, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, uploadedVideoUrl]);

  // ─── Cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      cleanup();
      if (uploadedVideoUrl) URL.revokeObjectURL(uploadedVideoUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────────
  const handleToggleWebcam = () => {
    setMode((prev) => (prev === MODE_WEBCAM ? MODE_IDLE : MODE_WEBCAM));
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (uploadedVideoUrl) URL.revokeObjectURL(uploadedVideoUrl);
    const url = URL.createObjectURL(file);
    setUploadedVideoUrl(url);
    setMode(MODE_VIDEO);
    e.target.value = "";
  };

  const handleStopVideo = () => {
    setMode(MODE_IDLE);
    if (uploadedVideoUrl) {
      URL.revokeObjectURL(uploadedVideoUrl);
      setUploadedVideoUrl(null);
    }
  };

  const isActive = mode !== MODE_IDLE;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="fixed bottom-3 right-5 z-20 flex items-center gap-6">
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Upload video"
          className="cursor-pointer bg-violet-500 hover:bg-violet-700 transition-colors duration-200 flex items-center justify-center w-14 h-14 rounded-full text-white drop-shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-7"
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
          accept="video/mp4,video/webm,video/*"
          className="hidden"
          onChange={handleVideoUpload}
        />

        <button
          onClick={handleToggleWebcam}
          title={mode === MODE_WEBCAM ? "Stop webcam" : "Start webcam"}
          className={`cursor-pointer ${
            mode === MODE_WEBCAM
              ? "bg-red-500 hover:bg-red-700"
              : "bg-indigo-400 hover:bg-indigo-700"
          } transition-colors duration-200 flex items-center justify-center w-14 h-14 rounded-full text-white drop-shadow-sm`}
        >
          {mode !== MODE_WEBCAM ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-7"
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
      </div>

      <div
        className={`absolute z-[999999] bottom-24 right-4 w-[320px] rounded-[20px] overflow-hidden transition-[height] duration-300 ${
          !isActive ? "hidden" : ""
        } ${mode === MODE_VIDEO ? "h-[500px]" : "h-[240px]"}`}
      >
        <canvas
          ref={drawCanvas}
          className="absolute z-10 w-full h-full bg-black/50 top-0 left-0"
        />

        <video
          ref={videoElement}
          className={`absolute z-0 w-full h-full top-0 left-0 ${
            mode === MODE_WEBCAM ? "" : "hidden"
          }`}
          muted
          playsInline
        />

        {uploadedVideoUrl && (
          <video
            ref={uploadedVideoEl}
            src={uploadedVideoUrl}
            className={`absolute z-0 w-full h-full top-0 left-0 object-fill ${
              mode === MODE_VIDEO ? "" : "hidden"
            }`}
            muted
            playsInline
            loop
          />
        )}

        {mode === MODE_VIDEO && (
          <button
            onClick={handleStopVideo}
            className="absolute top-2 right-2 z-20 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
            title="Stop video"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="size-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </>
  );
};
