import React, { useContext} from "react";

// reactstrap components
import {
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  UncontrolledButtonDropdown,
  Container,
  Row,
  Col,
} from "reactstrap";
import { queryContext } from "views/TwitterHome.js";
const moment = require('moment');

// core components

function ChooseTime() {
    const value = useContext(queryContext);
    return (
      <>
        <Container>
            <Row>
              <Col className="text-center">
                <UncontrolledButtonDropdown>
                    <DropdownToggle 
                    className="btn-round" color="info" type="button"  size="lg"
                    aria-haspopup={true}
                    caret
                    color="warning"
                    >
                    Time
                    </DropdownToggle>
                    <DropdownMenu>
                    <DropdownItem
                        href="#pablo"
                        onClick={() => value.dispatch({
                            type: "Time",
                            payload: {
                                time: moment().subtract(1, 'hours').unix()
                            }
                        })}
                    >
                        Latest Data
                    </DropdownItem>
                    <DropdownItem
                        href="#pablo"
                        onClick={() => value.dispatch({
                        type: "Time",
                        payload: {
                            time: moment().subtract(24, 'hours').unix()
                        }
                    })}
                    >
                        24 hours
                    </DropdownItem>
                    <DropdownItem
                        href="#pablo"
                        onClick={() => value.dispatch({
                        type: "Time",
                        payload: {
                            time: moment().subtract(3, 'days').unix()
                        }
                    })}
                    >
                        3 days
                    </DropdownItem>
                    <DropdownItem
                        href="#pablo"
                        onClick={() => value.dispatch({
                        type: "Time",
                        payload: {
                            time: moment().subtract(7, 'days').unix()
                        }
                    })}
                    >
                        7 days
                    </DropdownItem>
                    </DropdownMenu>
                </UncontrolledButtonDropdown>
              </Col>
              </Row>
            <div className="separator separator-primary"></div>
          </Container>   
      </>
    )
}

export default  ChooseTime;