'use strict';

let React = require('react');
let oPath = require('object-path');
let request = require('superagent');
let classNames = require('classnames');

var Settings = React.createClass({
    mixins: [require('react-addons-linked-state-mixin')],

    getInitialState() {
        return {
        };
    },

    componentDidMount() {
    },

    handleTabsChange(newValue) {
        this.setState({selectedTab: newValue});
    },

    render() {
        let self = this;

        return (
            <div className='s-settings'>
                Settings
            </div>
        );
    }
});


module.exports = Settings;