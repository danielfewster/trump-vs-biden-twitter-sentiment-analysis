import React, {useState, useEffect} from "react";
import axios from "axios";
// reactstrap components
import {
  Button,
  Input,
  InputGroupAddon,
  InputGroupText,
  InputGroup,
  Container,
  Row,
  Col,
  FormGroup,
  Progress
} from "reactstrap";

// core components
import ExamplesNavbar from "components/Navbars/ExamplesNavbar.js";
import LandingPageHeader from "components/Headers/LandingPageHeader.js";
import DefaultFooter from "components/Footers/DefaultFooter.js";
import TwitterNavbar from "components/Navbars/TwitterNavBar.js"
import TwitterCards from "components/TwitterCards";
import { useTwitterData } from "api/Api.js";
import Notifications from "./index-sections/Notifications";


function ShowSentiment (props) {
  let img = require("assets/img/neutral-smile.png")
  if(Math.sign(props.sentiment) === -1) {
    img = require("assets/img/sad-smile.png");
  } else if(Math.sign(props.sentiment) === 1) {
    img = require("assets/img/sad-smile.png");
  }
    return(
    <div>
      <Row>
        <Col  className="ml-auto mr-auto text-center" md="8">
          <img
            alt="..."
            className="rounded-circle"
            src={img}
          ></img>
        </Col>
        </Row>
        <Row>
        <Col className="ml-auto mr-auto text-center" md="8">
          <div> {props.search !== "" ? <h4>The current sentiment analysis indicates a {props.sentiment}%</h4> : <div></div>}
            
          </div>
        </Col>
      </Row>
    </div>
  )
}

function TwitterHome() {
  const [search , setSearch] = useState("");
  // const [tweetData, setTweetData] = useState();
  const [sentiment, setSentiment] = useState();
  const [topFivePositive, setTopFivePositive] = useState([]);
  const [topFiveNegative, setTopFiveNegative] = useState([]);
  

  const handleKeyDown = (e) => {
    if(e.key === "Enter") {
      setSearch(e.target.value); 
    }
  }

  useEffect(() => {
    let url = "http://" + window.location.hostname +  ":3001/search"
    if(search !== "") {
      axios.get(url, {
        params: {
          query: search
        }
      })
      .then((response) => {

        let tweets = response.data.tweetsWithSentiment
        tweets.sort((a,b) => parseFloat(a.sentiment) - parseFloat(b.sentiment));
        setTopFivePositive(tweets.slice(0).slice(-5))
        setTopFiveNegative(tweets.slice(0, 5))
       
        let sentimentData = response.data.overallSentiment * 100;
        setSentiment(sentimentData);
      })
    }
  }, [search]);

  let progressColor = "progress-container progress-success";
  if(sentiment < 0) {
    let  progressColor = "progress-container progress-primary";
  }


  return (
    <>
      <TwitterNavbar />
      <div className="wrapper">
        <LandingPageHeader />
        <div className="section section-about-us">
          <Container>
            <Row>
              <Col className="ml-auto mr-auto text-center" md="8">
              <FormGroup>
                  <Input
                    onKeyDown={handleKeyDown}
                    placeholder="Enter comma seperated list of search values"
                    type="text"
                  ></Input>
                </FormGroup>
              </Col>
              </Row>
             <ShowSentiment sentiment={sentiment} search={search} />
            <div className="separator separator-primary"></div>
          </Container>
        </div>
        <div className="section section-contact-us text-center">
          <Container>
    
            <Row>
              
                <Col className="text-center ml-auto mr-auto" lg="6" md="8">
                {topFivePositive.length ? 
                <div>
                  <p className="description">Top 5 positive tweets</p>
                  {topFivePositive.map(function(d, index){
                    return (<TwitterCards text={d.text} sentiment={d.sentiment} />)
                  })}
                   
                </div>
                : <div></div> 
                }
                </Col> 
              
             
              <Col>
              {topFiveNegative.length ? <div>
                <p className="description">Top 5 negative tweets</p>
                  {topFiveNegative.map(function(d, index){
                    return (<TwitterCards text={d.text} sentiment={d.sentiment} />)
                  })}
                </div> : <div></div>
              }
                
              </Col>  
            </Row>
          </Container>
        </div>
        <DefaultFooter />
      </div>
    </>
  );
}

export default TwitterHome;
