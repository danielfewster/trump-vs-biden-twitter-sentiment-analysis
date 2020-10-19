import React from "react";

// reactstrap components
import {
  Card,
  CardHeader,
  CardBody,
  NavItem,
  NavLink,
  Nav,
  TabContent,
  TabPane,
  Container,
  Row,
  Col,
} from "reactstrap";

// core components

function TwitterCards(props) {
  const [iconPills, setIconPills] = React.useState("1");
  const [pills, setPills] = React.useState("1");

  return (
    <>
      <div className="">
              <Card>
                <CardHeader>
                  <Nav
                    className="nav-tabs-neutral justify-content-center"
                    data-background-color="blue"
                    role="tablist"
                    tabs
                  >
                    <NavItem>
                      <NavLink
                        target="_blank"
                        id="twitter-tooltip"
                      >
                        <i className="fab fa-twitter"></i>
                        <p className="d-lg-none d-xl-none">Twitter</p>
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink>
                        Sentiment: {props.sentiment}%
                      </NavLink>
                    </NavItem>
                  </Nav>
                </CardHeader>
                <CardBody>
                  <TabContent
                    className="text-center"
                    activeTab={"pills" + pills}
                  >
                    <TabPane tabId="pills1">
                      <p>
                       {props.text}
                      </p>
                    </TabPane>
                  </TabContent>
                </CardBody>
              </Card>
      
      
      </div>
    </>
  );
}

export default TwitterCards;
