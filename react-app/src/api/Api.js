import {useEffect, useState} from 'react';
import axios from "axios";

export function useTwitterSearch (params) {
    const [data, setData] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        getTwitterSearch(params)
        // manipulate response to output required formatting for ag-grid table
        .then(response => {
            //get data and do something here
        }) 
        .then(data => {
            setData(data)
            setError(null);
        })
        .catch(error => {
            setError(error);
        });
    
      }, [params]);
      return{
          data,
          error
      }
}

function getTwitterSearch (params) {
    // call api and return result
    let url = process.env.REACT_APP_API_TWITTER;
    // only add additional search info if available
    if( params !== undefined ){
       
        url = url + "?query=" + search;
    }
    return axios.get(url)  
}
