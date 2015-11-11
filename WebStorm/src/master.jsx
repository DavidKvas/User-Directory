'use strict';

const React = require('react');
const Paper = require('material-ui/lib/paper');
const { Link } = require('react-router');

// Settings - coming in next version

var Master = React.createClass({
    render() {
        return (
          <div>
              <Paper style={{backgroundColor: '#00bcd4', padding: '25px 40px',fontSize:'30px',color:'#fff'}} zDepth={0} circle={false} rounded={false} transitionEnabled={true}>
                User Directory
              </Paper>
              <ul className='hide'>
                  <li><Link to="/settings">Settings</Link></li>
                  <li><Link to="/directory">Directory</Link></li>
              </ul>
              <div className='content'>
                {this.props.children}
              </div>
          </div>
        );
    }
});

module.exports = Master;