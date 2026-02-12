import React, { forwardRef, useImperativeHandle, useState } from "react";

const Avatar = forwardRef(function Avatar(props, ref) {
  const [mode, setMode] = useState("idle"); // idle | speaking | listening

  useImperativeHandle(ref, () => ({
    speak() {
      setMode("speaking");
    },
    stopSpeaking() {
      setMode("idle");
    },
    setMode(next) {
      setMode(next);
    }
  }));

  const src =
    mode === "speaking"
      ? "/avatar-speaking.png"
      : mode === "listening"
      ? "/avatar-listening.png"
      : "/avatar-idle.png";

  return (
    <div className={`avatar ${mode}`}>
      <img
        src={src}
        alt="Avatar IA"
        onError={(e) => {
          e.currentTarget.src = "/avatar-idle.png";
        }}
      />
    </div>
  );
});

export default Avatar;