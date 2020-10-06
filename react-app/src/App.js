import React from 'react';
import './App.css';
import { 
    BrowserRouter as Router,
    Route, 
    Switch 
} from 'react-router-dom';

function App() {
  return (
    <Router>
        <div className="App">
            <Switch>
                <Route path="/">
                    <Home />
                </Route>
            </Switch>
        </div>
    </Router>
  );
}

function Home() { // NOTE: Could organise in another routes foler, or just have functions, this react app shouldn't be too big
    return (
        <div>
            <h2>Home Route</h2>
        </div>
    );
}

export default App;
