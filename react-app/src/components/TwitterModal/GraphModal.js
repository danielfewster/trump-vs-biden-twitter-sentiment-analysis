import React, {createContext, useReducer} from "react";

// reactstrap components
import {
  Button,
  Container,
  Modal,
  ModalBody,
  Row,
  Col,
} from "reactstrap";
import LineGraph from "components/LineGraph/LineGraph.js"

export const graphContext = createContext();

const initialState = {
  index: null
};
const reducer = (state, action) => {
  switch (action.type) {
    case "graph clicked":
      return {
        ...state,
        index: action.payload,
      };

    default:
      return state;
  }
};

// core components

function GraphModal(props) {
  const [modal1, setModal1] = React.useState(false);
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <>
      <div className="section section-javascript" id="javascriptComponents">
        <graphContext.Provider
         value={{
          state,
          dispatch
        }}>
        <Container>
          <Row id="modals">
            <Col md="10">
              <Button
                color="info"
                className="mr-1"
                size="lg"
                onClick={() => setModal1(true)}
              >
              Graph
              </Button>
              <Modal isOpen={modal1} toggle={() => setModal1(false)}>
                <div className="modal-header justify-content-center">
                  <button
                    className="close"
                    type="button"
                    onClick={() => setModal1(false)}
                  >
                    <i className="now-ui-icons ui-1_simple-remove"></i>
                  </button>
                  <h4 className="title title-up">Click Price Indicator</h4>
                </div>
                <ModalBody>
                  <LineGraph data={props.data} />
                </ModalBody>
                <div className="modal-footer">
                  <Button
                    color="danger"
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

        </graphContext.Provider>
        
      </div>
    </>
  );
}

export default GraphModal;
