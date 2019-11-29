import React from "react";
import logo from "./logo.svg";
import "./App.css";
import FaceMatcher from "./FaceMatcher/FaceMatcherForm";
import objectDetectionSketch from "./ObjectDetectionSketch";

import P5Wrapper from "react-p5-wrapper";

const App: React.FC = () => {
  return (
    <div className="App">
      <FaceMatcher />
      {/* <P5Wrapper sketch={objectDetectionSketch} /> */}
    </div>
  );
};

export default App;
