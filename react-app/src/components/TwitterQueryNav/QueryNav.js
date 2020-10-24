import React, {useContext, useState} from "react";

// reactstrap components
import {
  Navbar,
  Nav,
  Container,
  Row,
  Col,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  UncontrolledButtonDropdown,
} from "reactstrap";
import { queryContext } from "views/TwitterHome.js";
// core components
const moment = require('moment');
function QueryNav() {
    const value = useContext(queryContext);
    const [label, setLabel] = useState('7 days');
    const [candidate, setCandidate] = useState('Biden');
    const [redis, setRedis] = useState("Redis off");

    return (
      <>
        <Navbar className="bg-info justify-content-center" >
            <Nav>
                <Container>
                    <Row>
                        <Col className="text-center">
                            <div>Please select a candidate and choose a time frame</div>
                        
                        </Col>
                    </Row>
                    <Row>
                        <Col className="text-center">
                        <UncontrolledButtonDropdown>
                                <DropdownToggle 
                                className="btn-round" type="button"  size="lg"
                                aria-haspopup={true}
                                caret
                                color="danger"
                                >
                                {candidate}
                                </DropdownToggle>
                                <DropdownMenu>
                                <DropdownItem
                                    href="#pablo"
                                    onClick={() => {
                                        setCandidate("Biden");
                                        value.dispatch({
                                            type: "Candidate",
                                            payload: "Biden"
                                        })

                                    }}
                                >
                                    Biden
                                </DropdownItem>
                                <DropdownItem
                                    href="#pablo"
                                    onClick={() => {
                                        setCandidate("Trump");
                                        value.dispatch({
                                            type: "Candidate",
                                            payload: "Trump"
                                        })

                                    }}
                                >
                                   Trump
                                </DropdownItem>
                                </DropdownMenu>
                             </UncontrolledButtonDropdown>
                             </Col>
                             <Col>
                             <UncontrolledButtonDropdown>
                                <DropdownToggle 
                                className="btn-round" type="button"  size="lg"
                                aria-haspopup={true}
                                caret
                                color="danger"
                                >
                                {label}
                                </DropdownToggle>
                                <DropdownMenu>
                                <DropdownItem
                                    href="#pablo"
                                    onClick={() => {
                                        setLabel("Latest");
                                        value.dispatch({
                                            type: "Time",
                                            payload: {
                                                time: moment().subtract(1, 'hours').unix(),
                                            }
                                        })

                                    }}
                                >
                                    Latest
                                </DropdownItem>
                                <DropdownItem
                                    href="#pablo"
                                    onClick={() => {
                                        setLabel("24 hours");
                                        value.dispatch({
                                            type: "Time",
                                            payload: {
                                                time: moment().subtract(24, 'hours').unix(),
                                            }
                                        })

                                    }}
                                >
                                    Yesterday
                                </DropdownItem>
                                <DropdownItem
                                    href="#pablo"
                                    onClick={() => {
                                        setLabel("3 days")
                                        value.dispatch({
                                            type: "Time",
                                            payload: {
                                                time: moment().subtract(3, 'days').unix(),
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
                                            }
                                        })

                                    } }
                                >
                                    7 days
                                </DropdownItem>
                                </DropdownMenu>
                             </UncontrolledButtonDropdown>
                             
                             </Col>
                           <Col>
                           <UncontrolledButtonDropdown>
                                <DropdownToggle 
                                className="btn-round" type="button"  size="lg"
                                aria-haspopup={true}
                                caret
                                color={redisColor}
                                >
                                {redis}
                                </DropdownToggle>
                                <DropdownMenu>
                                <DropdownItem
                                    href="#pablo"
                                    onClick={() => {
                                        setRedis("Redis off")
                                        value.dispatch({
                                            type: "Redis",
                                            payload: {
                                                redis: "no-redis"
                                            }
                                        })

                                    }}
                                >
                                Off
                                </DropdownItem>
                                <DropdownItem
                                    href="#pablo"
                                    onClick={() => {
                                        setRedis("Redis on")
                                        value.dispatch({
                                            type: "Redis",
                                            payload: {
                                                redis: "redis"
                                            }
                                        })

                                    }}
                                >
                                On
                                </DropdownItem>
                                </DropdownMenu>
                             </UncontrolledButtonDropdown>
                             
                        </Col>
                    </Row>
                <div className="separator separator-primary"></div>
            </Container>
            </Nav>  
        </Navbar>   
      </>
    )
}

export default  QueryNav;