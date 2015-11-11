'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const { Router } = require('react-router');
const AppRoutes = require('./app-routes.jsx');

require('babel-polyfill');

let injectTapEventPlugin = require("react-tap-event-plugin");
injectTapEventPlugin();

ReactDOM.render(
    <Router
        onUpdate={() => window.scrollTo(0, 0)}
        >
        {AppRoutes}
    </Router>
    ,
    document.getElementById('app'));