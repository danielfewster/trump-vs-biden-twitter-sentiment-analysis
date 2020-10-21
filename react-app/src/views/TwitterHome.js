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
import ChooseTime from "components/TwitterQueryNav/ChooseTime.js"

import GraphModal from "components/TwitterModal/GraphModal.js";
import TopicsModal from "components/TwitterModal/TopicsModal.js"

export const queryContext = createContext();
const moment = require('moment');
const initialState = {
  time: moment().subtract(7, 'days').unix(),
  candidate: "Biden",
  latest: false
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
  const [sentiment, setSentiment] = useState(0);
  const [topFivePositive, setTopFivePositive] = useState([]);
  const [topFiveNegative, setTopFiveNegative] = useState([]);
  const [info, setInfo] = useState([])
  const [state, dispatch] = useReducer(reducer, initialState);
  const [peopleTopics, setPeopleTopics] = useState([]);
  const [placesTopics, setPlacesTopics] = useState([]);
  const [route, setRoute] = useState("overall");
  const [loading, setLoading] =useState(true);
  const [error, setError] = useState();

  useEffect(() => {
    if(state.time !== null & state.candidate !== null) {
      let request = `http://` + window.location.hostname+ `:3001/api/${route}-sentiment/${state.time}/${state.candidate}`
      setLoading(true);
      axios.get(request)
      .then((response) => {
            setInfo(response.data.graphInfo);
            setPeopleTopics(response.data.responseTweets.occurencesOfTopics.people);
            setPlacesTopics(response.data.responseTweets.occurencesOfTopics.places);
            setSentiment(response.data.responseTweets.overallSentiment);
            setTopFiveNegative(response.data.responseTweets.sentimentRanked.topNeg);
            setTopFivePositive(response.data.responseTweets.sentimentRanked.topPos);
            setLoading(false);
      })
      .catch((e) =>{
        setError(e)
        setLoading(false);
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
          <Container>
            <Row>
                <Col>
                <Button 
                      className="btn-round" 
                      color="info" 
                      type="button"  
                      size="lg"
                      onClick={() => setRoute("redis")}>
                          Add redis
                </Button>
                <Button 
                      className="btn-round" 
                      color="danger" 
                      type="button"  
                      size="lg"
                      onClick={() => setRoute("overall")}>
                          Remove redis
                </Button>
                </Col>
              </Row>
          </Container>
          {!loading ?
           <div>
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
           <div>Loading</div> }
        </div>
       
        <DefaultFooter />
      </div>
    </queryContext.Provider>
    </>
  );
}

export default TwitterHome;
