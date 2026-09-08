import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import RoomControls from "./components/RoomControls";
import RoomInspector from "./components/RoomInspector";
import LoadingScreen from "./components/LoadingScreen";
import HelpPrompt from "./components/HelpPrompt";
import InterfaceUI from "./components/InterfaceUI";
import eventBus from "./EventBus";
import "./style.css";
import Documents from "../../documents/Documents";

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventBus.on("returningToDoor", () => setLoading(true));
    eventBus.on("loadingScreenDone", () => {
      setLoading(false);
    });
  }, []);

  return (
    <div id="ui-app">
      {!loading && (
        <>
          <HelpPrompt />
          <Documents />
          <RoomInspector />
        </>
      )}
      <RoomControls hidden={loading} />
      <LoadingScreen />
    </div>
  );
};

const createUI = () => {
  ReactDOM.render(<App />, document.getElementById("ui"));
};

const createVolumeUI = () => {
  ReactDOM.render(<InterfaceUI />, document.getElementById("ui-interactive"));
};

export { createUI, createVolumeUI };
