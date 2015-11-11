'use strict';

let React = require('react');
let oPath = require('object-path');
const SelectField = require('material-ui/lib/select-field');
const LinearProgress = require('material-ui/lib/linear-progress');
const Paper = require('material-ui/lib/paper');
const Tabs = require('material-ui/lib/tabs/tabs');
const Tab = require('material-ui/lib/tabs/tab');
const ClearFix = require('material-ui/lib/clearfix');
const TextField = require('material-ui/lib/text-field');
let request = require('superagent');
let classNames = require('classnames');
let handlebars = require('handlebars');
let _ = require('underscore');

var Directory = React.createClass({
    mixins: [require('react-addons-linked-state-mixin')],
    displayName: 'Directory',
    alphabet: "abcdefghijklmnopqrstuvwxyz".split(''),
    queryString: require('query-string').parse(window.location.search),
    sortByData: [
        {display: 'First Name', sortBy: 'FirstName'},
        {display: 'Last Name', sortBy: 'LastName'}
    ],

    getInitialState() {
        return {
            selectedTab: 'all',
            filter: '',
            sortBy: 'FirstName',
            data: [],
            userTemplate: null,
            currentRequest: null,
            userGroupSpecified: null,
            usersToDisplay: null,
            stopWords: ['microsoft', 'telstra', '_']
        };
    },

    componentDidMount() {
        this.loadSettings();
    },

    handleTabsChange(newValue) {
        this.setState({selectedTab: newValue});
    },

    loadSettings() {
        request
            .get(`${this.queryString.SPAppWebUrl}/_api/web/lists/GetByTitle('Settings')/items?$filter=Title eq 'UserTemplate'`)
            .set('Accept', 'application/json;odata=verbose;charset=utf-8')
            .type('json')
            .end((err, res)=> {
                if (res.ok) {
                    this.setState({userTemplate: handlebars.compile(res.body.d.results[0].Value1)});
                } else {
                    this.setState({userTemplate: require('./defaultUserTemplate.txt')});
                }
                this.loadSettingsCompleted();
            });

        request
            .get(`${this.queryString.SPAppWebUrl}/_api/web/lists/GetByTitle('Settings')/items?$filter=Title eq 'UserGroupsToDisplay'`)
            .set('Accept', 'application/json;odata=verbose;charset=utf-8')
            .type('json')
            .end((err, res)=> {
                if (res.ok) {
                    let userGroup = res.body.d.results[0].Value1;
                    if (userGroup) {
                        this.loadGroupMembership(userGroup);
                    } else {
                        this.setState({userGroupSpecified: false});
                        this.loadSettingsCompleted();
                    }
                }
            });
    },

    loadGroupMembership(groupName) {
        request.get(`${this.queryString.SPAppWebUrl}/_api/SP.AppContextSite(@target)/web/sitegroups/getbyname('${groupName}')/Users?@target='${this.queryString.SPHostUrl}'`)
            .set('Accept', 'application/json;odata=verbose;charset=utf-8')
            .type('json')
            .end((err, res)=> {
                let users = res.body.d.results.map(user=> {
                    return user.LoginName.toLowerCase();
                });
                this.setState({userGroupSpecified: true, usersToDisplay: users});
                this.loadSettingsCompleted();
            });
    },

    loadSettingsCounter: 0,
    loadSettingsCompleted() {
        this.loadSettingsCounter++;
        if (this.loadSettingsCounter == 2) {
            this.loadData();
        }
    },


    selectTab(newValue, e) {
        var self = this;
        this.setState({selectedTab: newValue}, ()=> {
            self.loadData()
        });
    },

    loadData(page = 1) {
        let self = this;
        let rowsPerPage = 6;
        let startRow = (page - 1) * rowsPerPage;
        let letter = (this.state.selectedTab == 'all' ? '' : this.state.selectedTab);
        let userFilter = this.state.filter;
        if (userFilter.length < 2) {
            userFilter = "";
        } else {
            userFilter = ` (${userFilter} OR ${userFilter}*)`;
        }

        if (this.state.currentRequest != null) {
            this.state.currentRequest.abort();
        }

        var searchQry =
        {
            'request': {
                'Querytext': `LastName:${letter}*${userFilter}`,
                'SelectProperties': {'results': ['JobTitle', 'WorkPhone', 'FirstName', 'LastName', 'AccountName', 'PreferredName', 'WorkEmail', 'Path', 'PictureURL', 'LargePictureURL', 'OfficeNumber', 'Department', 'MobilePhone', 'AboutMe']},
                'SortList': {'results': [{'Property': 'FirstName', 'Direction': '0'}]},
                'SourceId': 'b09a7990-05ea-4af9-81ef-edfab16c4e31',
                'RowsPerPage': rowsPerPage,
                'StartRow': startRow,
                'RowLimit': rowsPerPage,
                'ClientType': 'ContentSearchRegular'
            }
        };

        if (page == 1) {
            this.setState({data: []});
        }

        let currentRequest =
            request
                .post(`${this.queryString.SPAppWebUrl}/_api/search/postquery`)
                .set('Accept', 'application/json;odata=verbose;charset=utf-8')
                .set('X-RequestDigest', document.getElementById("__REQUESTDIGEST").value)
                .send(JSON.stringify(searchQry))
                .type('application/json;odata=verbose;charset=utf-8')
                .end((err, res)=> {
                    if (res.ok) {
                        var totalRows = res.body.d.postquery.PrimaryQueryResult.RelevantResults.TotalRows;
                        let users = res.body.d.postquery.PrimaryQueryResult.RelevantResults.Table.Rows.results.map(
                            (item)=> {
                                return self.getFields(item.Cells.results);
                            });
                        let filteredUser = this.filterUnwantedUsers(users);
                        let loadedUser = [...this.state.data, ...filteredUser];
                        self.setState({currentRequest: null, data: loadedUser});
                        if (rowsPerPage * page < totalRows) {
                            this.loadData(page + 1);
                        }
                    }
                });
        this.setState({currentRequest: currentRequest});
    },

    filterUnwantedUsers(users = []){
        let usersToDisplay = [];
        if (this.state.userGroupSpecified) {
            usersToDisplay = this.state.usersToDisplay;
            /*
             usersToDisplay = this.state.usersToDisplay.map(user=> {
             return user.toLowerCase();
             });
             */
        }
        return users.filter(user=> {
            let accountName = user.AccountName.toLocaleLowerCase();
            if (this.state.userGroupSpecified) {
                if (usersToDisplay.indexOf(accountName) == -1) {
                    return false;
                }
            }
            let findIndex = this.state.stopWords.findIndex(word=> {
                return user.PreferredName.toLowerCase().indexOf(word) > -1;
            });
            return findIndex == -1;
        });
    },

    getFields(results) {
        var r = {};
        for (var i = 0; i < results.length; i++) {
            if (results[i] != undefined && results[i].Key != undefined) {
                r[results[i].Key] = results[i].Value;
            }
        }

        let pictureUrl = encodeURIComponent(r.PictureURL);
        r.PictureURL = `${this.queryString.SPAppWebUrl}/_layouts/15/userphoto.aspx?size=M&url=${pictureUrl}`;
        r.LargePictureURL = `${this.queryString.SPAppWebUrl}/_layouts/15/userphoto.aspx?size=L&url=${pictureUrl.toLocaleLowerCase().replace('mthumb', 'lthumb')}`;
        return r;
    },

    filterData(e) {
        this.setState({filter: e.target.value}, ()=> {
            this.loadData();
        });
    },

    render() {
        let self = this;
        let data = oPath.get(this.state, 'data', []);

        var users = _.chain(data);
        var sortedUsers = users.sortBy(this.state.sortBy).value();

        return (
            <div className='s-directory'>
                <TextField floatingLabelText="Filter" onChange={this.filterData} style={{float:'left',marginRight:'10px'}}/>
                <SelectField
                    valueLink={this.linkState('sortBy')}
                    floatingLabelText='Sort By'
                    valueMember='sortBy'
                    displayMember='display'
                    menuItems={this.sortByData}
                    style={{float:'left'}}
                    />
                <ClearFix />
                <Tabs valueLink={this.linkState('selectedTab')}>
                    <Tab key='all' label='All' value='all' onClick={this.selectTab.bind(null,'all')}/>
                    {
                        this.alphabet.map((letter)=> {
                            return <Tab key={letter} label={letter.toUpperCase()} value={letter} onClick={self.selectTab.bind(null,letter)}/>;
                        })
                    }
                </Tabs>
                <Paper rounded={false}>
                    <div className='usersPanel'>
                        <Users data={sortedUsers} userTemplate={this.state.userTemplate}/>
                        <ClearFix />
                    </div>
                    <div className={classNames('progressBar',{'hide':this.state.currentRequest == null})}>
                        <LinearProgress mode="indeterminate"/>
                    </div>
                </Paper>
            </div>
        );
    }
});


let Users = ({data,userTemplate}) => {
    if (userTemplate == null) {
        return <div />;
    }

    return (<div>
        {
            data.map((user, index)=> {
                return <div key={index} style={{float: 'left'}} dangerouslySetInnerHTML={{__html: userTemplate(user)}}/>;
            })
        }
    </div>);
};

module.exports = Directory;