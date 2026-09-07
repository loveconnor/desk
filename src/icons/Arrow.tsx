import React from "react";
import "./icons.css";
export default function Arrow({
  direction = "external",
}: {
  direction?: "external" | "right" | "down" | "reload" | "play";
}) {
  const paths = {
    external: "M7 17 17 7M7 7h10v10",
    right: "M4 12h16m-7-7 7 7-7 7",
    down: "m6 9 6 6 6-6",
    reload: "M20 7v5h-5M20 12a8 8 0 1 0-2.35 5.65M20 12l-2-5",
    play: "m8 5 11 7-11 7Z",
  };
  return (
    <svg
      className="ui-arrow"
      viewBox="0 0 24 24"
      fill={direction === "play" ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[direction]} />
    </svg>
  );
}
