import React from "react";
import ReactDOM from "react-dom/client";
import { App as AntdApp } from "antd";
import { BrowserRouter } from "react-router-dom";
import "antd/dist/reset.css";
import App from "./App";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AntdApp>
        <App />
      </AntdApp>
    </BrowserRouter>
  </React.StrictMode>
);
