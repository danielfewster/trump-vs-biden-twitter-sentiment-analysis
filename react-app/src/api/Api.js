import {useEffect, useState} from 'react';
import axios from "axios";

export function useTwitterData (params) {
    const [rowData, setRowData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        getTwitterData(params)
        // manipulate response to output required formatting for ag-grid table
        .then(data => {
            console.log("got response from API")
            setRowData(data)
            setLoading(false);
            setError(null);
        })
        .catch(error => {
            setError(error);
        });
    
      }, [params]);
      return{
          rowData,
          loading,
          error
      }
}

function getTwitterData (params) {
    // call api and return result
    // let url = process.env.REACT_APP_API_TWITTER;
    let url = "http://" + window.location.hostname + "/search"
    // only add additional search info if available
    if( params !== undefined ){
       
        url = url + "?query=" + params;
    }
    return axios.get(url)  
}
