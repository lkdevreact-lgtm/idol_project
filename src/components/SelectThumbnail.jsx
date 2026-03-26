import React from "react";
import { useVideoStore } from "../hooks/useVideoStore";

const arrModels = [
  {
    id: 1,
    name: "Model 1",
    image: "/images-modal/avatar-1.jpg",
    video: "/video/pony.mp4",
  },
  {
    id: 2,
    name: "Model 2",
    image: "/images-modal/avatar-1.jpg",
    video: "/video/font-2.mp4",
  },
  {
    id: 3,
    name: "Model 3",
    image: "/images-modal/avatar-1.jpg",
    video: "/video/pony.mp4",
  },
  {
    id: 4,
    name: "Model 4",
    image: "/images-modal/avatar-1.jpg",
    video: "/video/pony.mp4",
  },
  {
    id: 5,
    name: "Model 5",
    image: "/images-modal/avatar-1.jpg",
    video: "/video/pony.mp4",
  },
];

const SelectThumbnail = () => {
  const selectedVideo = useVideoStore((s) => s.selectedVideo);
  const setSelectedVideo = useVideoStore((s) => s.setSelectedVideo);

  return (
    <section className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none">
      <div className="absolute right-4 w-[300px] h-[400px] rounded-2xl bg-white/10 backdrop-blur-xs">
        <div className="w-full flex items-center justify-center py-3 border-b border-white/10 text-white font-semibold mb-5">
          Chọn người mẫu
        </div>
        <div className="flex-1 overflow-auto flex flex-col gap-5">
          {arrModels.map((model) => {
            const isSelected = selectedVideo && selectedVideo === model.video;
            return (
              <div
                key={model.id}
                onClick={() => setSelectedVideo(model.video)}
                className="w-full flex items-center justify-between px-3 cursor-pointer pointer-events-auto rounded-xl py-1 transition-all"
                style={{
                  background: isSelected
                    ? "rgba(255,255,255,0.18)"
                    : "transparent",
                  outline: isSelected
                    ? "1.5px solid rgba(255,255,255,0.5)"
                    : "none",
                }}
              >
                <div
                  className="rounded-md overflow-hidden border-2"
                  style={{
                    borderColor: isSelected ? "#fff" : "rgba(255,255,255,0.5)",
                  }}
                >
                  <img
                    src={model.image}
                    alt=""
                    className="w-10 h-10 object-cover"
                  />
                </div>
                <p className="text-white font-medium">{model.name}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SelectThumbnail;
