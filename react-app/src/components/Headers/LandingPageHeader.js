import React from "react";

// reactstrap components
import { Container, Row, Col } from "reactstrap";

// core components

function LandingPageHeader() {
  let pageHeader = React.createRef();
  return (
    <>
      <div className="page-header page-header-small">
        <div
          className="page-header-image"
          style={{
            backgroundImage: "url(" + require("assets/img/twitter_sentiment.jpeg") + ")",
          }}
          ref={pageHeader}
        ></div>
        <div className="content-center">
          <Container>
            <Row>
            <Col>
            <h1 className="title">Welcome to Presidential Election Twitter Analytics</h1>
            </Col>
            </Row>
          </Container>

        </div>
      </div>
    </>
  );
}

export default LandingPageHeader;
