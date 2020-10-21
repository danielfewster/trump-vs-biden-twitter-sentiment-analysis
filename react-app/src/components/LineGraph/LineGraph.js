import React, { useContext } from 'react';
import {Line} from 'react-chartjs-2';

function LineGraph (props) {
  
  const state = {
      labels: props.data.graphInfoLables,
      datasets: [
        {
          label: 'Sentiment over time',
          fill: true,
          lineTension: 0.1,
          backgroundColor: 'rgba(52, 171, 235,1)',
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
            }
        }}
        />
    </div>
    );
}

export default LineGraph;
