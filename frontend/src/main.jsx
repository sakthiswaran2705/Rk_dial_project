import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import RouterPage from "./Router.jsx";
import { PageProvider } from "./PageStore.jsx";

import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "bootstrap/dist/css/bootstrap.min.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>

    <PageProvider>
      <BrowserRouter>
        <RouterPage />
      </BrowserRouter>
    </PageProvider>
  </React.StrictMode>
);

{/*import React from "react";
import ReactDOM from "react-dom/client";
import MapView from "./MapPage.jsx";  // FIXED ✔️
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MapView />
  </React.StrictMode>
);
*/}