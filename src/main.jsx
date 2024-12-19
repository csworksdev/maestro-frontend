import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "simplebar-react/dist/simplebar.min.css";
import "flatpickr/dist/themes/light.css";
import "../src/assets/scss/app.scss";
import "../src/assets/scss/app.css";
import { BrowserRouter } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { Provider } from "react-redux";
import store, { persistor } from "@/redux/store";
// import store from "./store";
import "react-toastify/dist/ReactToastify.css";
// import "./server";
import { PersistGate } from "redux-persist/integration/react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <BrowserRouter future={{ v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </PersistGate>
  </Provider>
);
