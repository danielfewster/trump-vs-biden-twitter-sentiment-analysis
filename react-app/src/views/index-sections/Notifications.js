import React from "react";

// reactstrap components
import { Alert, Container } from "reactstrap";

// core components

function Notifications(props) {
  const [alert1, setAlert1] = React.useState(true);


  return (
    <>
      <div className="section section-notifications">
        <Alert color="success" isOpen={alert1}>
          <Container>
            <div className="alert-icon">
              <i className="now-ui-icons ui-1_check"></i>
            </div>
            <strong>Positive!</strong> The sentiment for you search is currently positive.

          </Container>
        </Alert>
      </div>
    </>
  );
}

export default Notifications;
