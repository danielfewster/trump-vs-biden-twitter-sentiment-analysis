import React, {useState, useEffect, createContext, useReducer} from "react";
import axios from "axios";
// reactstrap components
import {
  Container,
  Row,
  Col,
} from "reactstrap";

// core components
import LandingPageHeader from "components/Headers/LandingPageHeader.js";
import DefaultFooter from "components/Footers/DefaultFooter.js";
import TwitterNavbar from "components/Navbars/TwitterNavBar.js"
import TwitterCards from "components/TwitterCards";
import QueryNav from "components/TwitterQueryNav/QueryNav.js"
import ChooseTime from "components/TwitterQueryNav/ChooseTime.js"

import GraphModal from "components/TwitterModal/GraphModal.js";
import TopicsModal from "components/TwitterModal/TopicsModal.js"

export const queryContext = createContext();
const moment = require('moment');
const initialState = {
  time: moment().subtract(7, 'days').unix(),
  candidate: "Biden",
};
const reducer = (state, action) => {
  switch (action.type) {
    case "Biden":
      return {
        ...state,
        candidate: action.payload,
      };
    case "Trump":
      return {
        ...state,
        candidate: action.payload,
       
      }
    case "Time":
      return{
        ...state,
        time: action.payload.time
      }
    default:
      return state;
  }
};

function ShowSentiment (props) {
  let img = require("assets/img/neutral-smile.png")
  if(props.state.candidate === "Biden") {
    img = require("assets/img/biden.jpg");
  } else if(props.state.candidate === "Trump") {
    img = require("assets/img/trump.jpg");
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
          <div> {props.sentiment !== null ? <h4>Sentiment for  {props.state.candidate + " is " +Math.round(props.sentiment)}%</h4> : <div></div>}
            
          </div>
        </Col>
      </Row>
    </div>
  )
}

function TwitterHome() {

  // const [tweetData, setTweetData] = useState();
  const [sentiment, setSentiment] = useState(0);
  const [topFivePositive, setTopFivePositive] = useState([]);
  const [topFiveNegative, setTopFiveNegative] = useState([]);
  const [info, setInfo] = useState([])
  const [state, dispatch] = useReducer(reducer, initialState);
  const [peopleTopics, setPeopleTopics] = useState([]);
  const [placesTopics, setPlacesTopics] = useState([]);

  useEffect(() => {
    if(state.time !== null & state.candidate !== null) {
      let request = "http://" + window.location.hostname+ ":3001/api/overall-sentiment/" + state.time +"/" + state.candidate;
      axios.get(request)
      .then((response) => {
            console.log(response);
            let overallTopPos = [];
            let overallTopNeg = [];
            let oSentiment = 0;
            let tempTopics = {
                places: [],
                people: [],
            };
            let graphInfoSentiment = [];
            let graphInfoLables = [];
            let graphInfo = {};

            response.data.Items.forEach(object => {
                    let o = JSON.parse(object.info);
                    o.sentimentRanked.topPos.forEach(e => overallTopPos.push(e));
                    o.sentimentRanked.topNeg.forEach(e => overallTopNeg.push(e));
                    oSentiment += o.overallSentiment;
                    tempTopics.places.push(o.occurencesOfTopics.places);
                    tempTopics.people.push(o.occurencesOfTopics.people);
                    graphInfoSentiment.push(o.overallSentiment);
                    graphInfoLables.push(moment.unix(object.unixTimeOfQuery).format("ddd, h:mA"));
                  }  
            )
            console.log(graphInfoLables);
                
            graphInfo = {
              graphInfoLables,
              graphInfoSentiment
            }
      

            const countTopics = data => {
                let result = {}; //(1)
              
                data.forEach(topic => { //(2)
                  for (let [key, value] of Object.entries(topic)) { //(3)
                    if (result[key]) { //(4)
                      result[key] += value; //(5)
                    } else { //(6)
                      result[key] = value;
                    }
                   }
            
                });
                return result; //(7)
            };
              
            const people =  Object.entries(countTopics(tempTopics.people)).sort((a, b) =>b[1] - a[1]).slice(0, 5);
            const places =  Object.entries(countTopics(tempTopics.places)).sort((a, b) => b[1] - a[1]).slice(0, 5);

            let uniqPos = overallTopPos.filter((thing, index, self) =>
                index === self.findIndex((t) => (
                t.id === thing.id || t.text === thing.text
                ))
            )
            let uniqNeg = overallTopNeg.filter((thing, index, self) =>
                index === self.findIndex((t) => (
                t.id === thing.id || t.text === thing.text
                ))
            )
            setInfo(graphInfo);
            setPeopleTopics(people);
            setPlacesTopics(places);
            setSentiment(oSentiment / response.data.Items.length)
            setTopFiveNegative(uniqNeg.sort((a, b) => b.sentiment - a.sentiment).slice(0).slice(-5).reverse())
            setTopFivePositive(uniqPos.sort((a, b) => b.sentiment - a.sentiment).slice(0, 5))
  
        
      })
    }
  }, [state.time, state.candidate]);

  return (
    <>
    <queryContext.Provider
      value={{
        state,
        dispatch
      }}
      >
    <TwitterNavbar />
      <div className="wrapper">
        <LandingPageHeader />
        <QueryNav />
        <div >
          <ChooseTime />
          <Container className="justify-content-center">
            <Row>
              <Col>
                {sentiment !== 0 ? <ShowSentiment sentiment={sentiment} state={state} />: <div/>}
              </Col>
            </Row>
            <Row>
            <Col className="text-center justify-content-center">
              {sentiment !== 0 ?<GraphModal data={info} />: <div/>}
              </Col >
              <Col className="text-center justify-content-center">
              {sentiment !== 0 ?<TopicsModal title="Places" data={placesTopics} />: <div/>}
              </Col>
              <Col className="text-center justify-content-center">
              {sentiment !== 0 ?  <TopicsModal title="People" data={peopleTopics} />: <div/>}
              </Col>
            </Row>
           
      
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
                    return (<TwitterCards key={index} text={d.text} sentiment={d.sentiment} />)
                  })}
                   
                </div>
                : <div></div> 
                }
                </Col> 
              <Col>
              {topFiveNegative.length ? <div>
                <p className="description">Top 5 negative tweets</p>
                  {topFiveNegative.map(function(d, index){
                    return (<TwitterCards key={index} text={d.text} sentiment={d.sentiment} />)
                  })}
                </div> : <div></div>
              } 
              </Col>  
            </Row>
          </Container>
        </div>
        <DefaultFooter />
      </div>
    </queryContext.Provider>
    </>
  );
}

export default TwitterHome;
