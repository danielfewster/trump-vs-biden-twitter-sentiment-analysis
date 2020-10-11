import React, { useState } from 'react';
import '../App.css';
import { Button, Input, InputGroup } from "reactstrap";

function AddParams (props) {
  const [innerParam, setInnerParam] = useState("");
  const handleSubmit = (event) => {
    props.onSubmit(innerSearch);
    setInnerSearch("");
  };

  return (
      <div className="search">
        <InputGroup >
        <Button 
            type="button" 
            id="search-button"
            color="info"
            onClick={handleSubmit}>
              Add Parameter
        </Button>
        <Input 
          aria-labelledby="search-button"
          name="search"
          id="search"
          type="search"
          value={innerParam}
          onChange = {(e) => setInnerParam(e.target.value)}
        /> 
        </InputGroup>
      </div>
  )
}

export default SearchBar;