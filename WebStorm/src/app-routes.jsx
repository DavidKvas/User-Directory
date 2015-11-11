const React = require('react');
const {
    Route,
    Redirect,
    IndexRoute,
    } = require('react-router');


const Master = require('./master.jsx');
const Directory = require('./components/directory/directory.jsx');
// Settings is coming in next version
const Settings = require('./components/settings/settings.jsx');

const AppRoutes = (
    <Route path="/" component={Master}>
        <Route path="directory" component={Directory} />
        <Route path="settings" component={Settings} />

        <IndexRoute component={Directory}/>
    </Route>
);

module.exports = AppRoutes;