import React, { useEffect, useState } from "react";
import { RoomDetail } from "../../World/RoomInteractions";
import UIEventBus from "../EventBus";
export default function RoomInspector() {
  const [detail, setDetail] = useState<RoomDetail | null>(null);
  useEffect(() => {
    const show = (e: Event) => setDetail((e as CustomEvent).detail);
    const hide = () => setDetail(null);
    document.addEventListener("inspectRoomObject", show);
    document.addEventListener("roomObjectReturned", hide);
    return () => {
      document.removeEventListener("inspectRoomObject", show);
      document.removeEventListener("roomObjectReturned", hide);
    };
  }, []);
  return detail ? (
    <div
      className="object-in-hand"
      data-desk-ui
      aria-label={`Inspecting ${detail.title}`}
    >
      <span>Drag to turn · Esc to put back</span>
      <button
        className="portfolio-control"
        onClick={() => UIEventBus.dispatch("putBackRoomObject", {})}
      >
        Put back ↙
      </button>
      {detail.href && (
        <a
          className="portfolio-control"
          href={detail.href}
          target="_blank"
          rel="noreferrer"
        >
          Read more ↗
        </a>
      )}
    </div>
  ) : null;
}
