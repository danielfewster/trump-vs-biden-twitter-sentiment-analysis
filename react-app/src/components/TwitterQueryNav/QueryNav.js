import React, {useState, useContext} from "react";

// reactstrap components
import {
  Collapse,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  UncontrolledDropdown,
  NavbarBrand,
  Navbar,
  Button,
  UncontrolledButtonDropdown,
  NavItem,
  NavLink,
  Nav,
  Container,
  Row,
  Col,
} from "reactstrap";
import { queryContext } from "views/TwitterHome.js";
// core components

function QueryNav() {

    const value = useContext(queryContext);

    return (
      <>
        <Navbar className="bg-info justify-content-center" >
            <Nav>
                <Container>
                    <Row>
                        <Col className="text-center">
                            <div>Please select a candidate and choose a time frame</div>
                        <Button 
                        className="btn-round"
                         color="danger" 
                         type="button"  
                         size="lg"
                         onClick={() => value.dispatch({
                             type:"Biden",
                             payload: "Biden"
                         })}>
                            Biden
                        </Button>
                     
                        -----------
                      
                        <Button 
                        className="btn-round" 
                        color="danger" 
                        type="button"  
                        size="lg"
                        onClick={() => value.dispatch({
                            type:"Trump",
                            payload: "Trump"
                        })}>
                            Trump
                        </Button>
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