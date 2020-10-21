import React, { useContext, useState } from "react";

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
    const [label, setLabel] = useState('Today')
    
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
                    {label}
                    </DropdownToggle>
                    <DropdownMenu>
                    <DropdownItem
                        href="#pablo"
                        onClick={() => {
                            setLabel("Today");
                            value.dispatch({
                                type: "Time",
                                payload: {
                                    time: moment().subtract(1, 'hours').unix(),
                                    latest: true
                                }
                            })

                        }}
                    >
                        Today
                    </DropdownItem>
                    <DropdownItem
                        href="#pablo"
                        onClick={() => {
                            setLabel("3 days")
                            value.dispatch({
                                type: "Time",
                                payload: {
                                    time: moment().subtract(3, 'days').unix(),
                                    latest: false
                                }
                            })
                        } }
                    >
                        3 days
                    </DropdownItem>
                    <DropdownItem
                        href="#pablo"
                        onClick={() => {
                            setLabel("7 days")
                            value.dispatch({
                                type: "Time",
                                payload: {
                                    time: moment().subtract(7, 'days').unix(),
                                    latest: false
                                }
                            })

                        } }
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