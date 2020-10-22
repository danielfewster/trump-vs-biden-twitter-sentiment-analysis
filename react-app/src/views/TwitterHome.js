import React, {useState, useEffect, createContext, useReducer} from "react";
import axios from "axios";
// reactstrap components
import {
  Container,
  Row,
  Col,
  Button
} from "reactstrap";

// core components
import LandingPageHeader from "components/Headers/LandingPageHeader.js";
import DefaultFooter from "components/Footers/DefaultFooter.js";
import TwitterNavbar from "components/Navbars/TwitterNavBar.js"
import TwitterCards from "components/TwitterCards";
import QueryNav from "components/TwitterQueryNav/QueryNav.js"

import GraphModal from "components/TwitterModal/GraphModal.js";
import TopicsModal from "components/TwitterModal/TopicsModal.js"

export const queryContext = createContext();
const moment = require('moment');
const initialState = {
  time: moment().subtract(7, 'days').unix(),
  candidate: "Biden",
  latest: false,
  redis: "no-redis"
};
const reducer = (state, action) => {
  switch (action.type) {
    case "Candidate":
      return {
        ...state,
        candidate: action.payload,
      };
    case "Time":
      return{
        ...state,
        time: action.payload.time
      };
    case "Redis":
      return{
        ...state,
        redis: action.payload.redis
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
  const [sentiment, setSentiment] = useState(0);
  const [topFivePositive, setTopFivePositive] = useState([]);
  const [topFiveNegative, setTopFiveNegative] = useState([]);
  const [info, setInfo] = useState([])
  const [state, dispatch] = useReducer(reducer, initialState);
  const [peopleTopics, setPeopleTopics] = useState([]);
  const [placesTopics, setPlacesTopics] = useState([]);
  const [loading, setLoading] =useState(true);
  const [error, setError] = useState();

  let redis = state.redis;
  useEffect(() => {
    if(state.time !== null & state.candidate !== null) {
      
      console.log(redis)
      let request = `http://` + window.location.hostname+ `:3001/api/${state.redis}-sentiment/${state.time}/${state.candidate}`
      setLoading(true);

      axios.get(request)
      .then((response) => {
            setInfo(response.data.graphInfo);
            setPeopleTopics(response.data.responseTweets.occurencesOfTopics.people);
            setPlacesTopics(response.data.responseTweets.occurencesOfTopics.places);
            setSentiment(response.data.responseTweets.overallSentiment);
            setTopFiveNegative(response.data.responseTweets.sentimentRanked.topNeg);
            setTopFivePositive(response.data.responseTweets.sentimentRanked.topPos);
      })
      .then(response => {
        setLoading(false);
        setError(false);
      } )
      .catch((e) =>{
        setError("Error: something went wrong, please try again shortly")
      })
    }
  }, [state.time, state.candidate, state.redis]);


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
        <div>
          {!error ? 
           <div >
           {!loading ?
            <div>
            <Container className="justify-content-center">
              <Row>
                <Col>
                 <ShowSentiment sentiment={sentiment} state={state} />
                </Col>
              </Row>
              <Row>
              <Col className="text-center justify-content-center">
                <GraphModal data={info} />
                </Col >
                <Col className="text-center justify-content-center">
                <TopicsModal title="Places" data={placesTopics} />
                </Col>
                <Col className="text-center justify-content-center">
                <TopicsModal title="People" data={peopleTopics} />
                </Col>
              </Row>
             
        
              <div className="separator separator-primary"></div>
            </Container>
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
              
            </div>: 
              <div className="modal-header justify-content-center">
              <div className="modal-profile">
                <i className="now-ui-icons loader_refresh"></i>
                Loading
              </div>
            </div> }
         </div> : 
         <div className="modal-header justify-content-center">Error: Something went wrong please try again shortly.</div>
        }
       

        </div>
       
       
        <DefaultFooter />
      </div>
    </queryContext.Provider>
    </>
  );
}

export default TwitterHome;
