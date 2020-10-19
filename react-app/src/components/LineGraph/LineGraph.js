import React, { useContext } from 'react';
import {Line} from 'react-chartjs-2';


import graphContext from "components/TwitterModal/GraphModal.js";

function LineGraph (props) {
  const value = useContext(graphContext);
console.log(props.data)
  
  const state = {
      labels: props.data.graphInfoLables,
      datasets: [
        {
          label: 'Price movement for ' + props.coin,
          fill: true,
          lineTension: 0.1,
          backgroundColor: 'rgba(75,192,192,1)',
          borderColor: 'rgba(0,0,0,1)',
          borderWidth: 2,
          data: props.data.graphInfoSentiment
        }
      ]
    }
    
    return (
    // line graph
    <div className="line-graph">
        <Line
        data={state}
        options={{
            legend:{
            display:true,
            position:'bottom'
            },
            onClick: function(evt, element) {
              if(element.length > 0) {
                let ind = element[0]._index;
               value.dispatch({
                  type: "graph clicked",
                  payload: ind
                })
              }
            }
        }}
        />
    </div>
    );
}

export default LineGraph;
