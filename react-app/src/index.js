import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route, Switch } from "react-router-dom";

// styles for this kit
import "assets/css/bootstrap.min.css";
import "assets/scss/now-ui-kit.scss?v=1.4.0";
import "assets/demo/demo.css?v=1.4.0";
import "assets/demo/nucleo-icons-page-styles.css?v=1.4.0";
// pages for this kit
import TwitterHome from "views/TwitterHome.js";

ReactDOM.render(
  <BrowserRouter>
    <Switch>
      <Switch>
         <Route
          path="/"
          render={(props) => <TwitterHome {...props} />}
        />
      </Switch>
    </Switch>
  </BrowserRouter>,
  document.getElementById("root")
);
