import React, {Component} from 'react';
import {Router, Route, IndexRoute, browserHistory} from 'react-router';
import Order from './components/order';
import Welcome from './containers/order/welcome';
import Home from './components/home';
import OrderProcessing from './components/order-processing';



class App extends Component {
    render() {
        return (

                <Router history={browserHistory}>
                    <Route path="/" component={Home}>
                        <IndexRoute component={Welcome}/>
                        <Route path="order" component={Order}/>
                        <Route path="processing-order" component={OrderProcessing}/>
                    </Route>
                </Router>

        );
    }
}

export default App;
