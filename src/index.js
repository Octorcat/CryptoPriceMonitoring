import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Provider } from 'react-redux'
import store from './redux/store'
import './style/index.css';
import './style/Alert.css'
import Topmenu from './components/Topmenu';
import Searchedit from './components/Cryptopage';
import Unsubscribe from './components/Unsubscribe'
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
  <Provider store={store}>
    <React.StrictMode>
      <Router>
        <Switch>
          <Route exact path='/unsubscribe/:alertId' component={Unsubscribe} />
          <Route path='/' render={() => 
            <>
              <Topmenu/>
              <Searchedit/>
            </>
          }/>
        </Switch>
      </Router>
      
    </React.StrictMode>
  </Provider>
  ,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
