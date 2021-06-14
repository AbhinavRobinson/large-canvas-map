import React from "react";
import "./App.css";
import render from "./plugins/renderCanvas";

const App: React.FC = () => {
  React.useEffect(() => {
    render();
  }, []);

  return <div className="App"></div>;
};

export default App;
