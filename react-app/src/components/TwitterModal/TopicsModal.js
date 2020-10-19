import React from "react";
// react plugins that creates an input with a date picker
import Datetime from "react-datetime";
// reactstrap components
import {
  Button,
  FormGroup,
  Container,
  Modal,
  ModalBody,
  Row,
  Col,
  UncontrolledTooltip,
  PopoverBody,
  PopoverHeader,
  UncontrolledPopover,
} from "reactstrap";
import LineGraph from "components/LineGraph/LineGraph.js"

// core components

function TopicsModal(props) {
  const [modal1, setModal1] = React.useState(false);
  return (
    <>
      <div className="section section-javascript" id="javascriptComponents">
        <Container>
          <Row id="modals">
            <Col md="10">
              <Button
                color="info"
                size="lg"
                className="mr-1"
                onClick={() => setModal1(true)}
              >
              {props.title}
              </Button>
              <Modal
                modalClassName="modal-mini modal-info"
                toggle={() => setModal1(false)}
                isOpen={modal1}
              >
                <div className="modal-header justify-content-center">
                  <div className="modal-profile">
                    <i className="now-ui-icons users_circle-08"></i>
                  </div>
                </div>
                <ModalBody>
                  {props.data.map(([key, value]) => {
                      return (<div key={key}>{key} : {value}</div>)
                  })}
                </ModalBody>
                <div className="modal-footer">
                  <Button
                    className="btn-neutral"
                    color="link"
                    type="button"
                    onClick={() => setModal1(false)}
                  >
                    Close
                  </Button>
                </div>
              </Modal>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
}

export default TopicsModal;
