const fetch = require("node-fetch")
const Users = require('../models/user.model.js');
const config =  require('../../config');
const axios = require('axios');

const { useScrollTrigger } = require("@mui/material");

module.exports = (app) => {
    const alerts = require('../controllers/alert.controller.js');
    app.post('/alerts/save', alerts.save);
    app.post('/alerts/remove', alerts.remove);
    app.post('/alerts/read', alerts.read);
    app.post('/alerts/savedefault', alerts.saveDefault);
    app.post('/alerts/update', alerts.update);
    app.post('/alerts', alerts.all);
    app.post('/alerts/unsubscribe', alerts.unsubscribe)
    app.post('/price', alerts.price)
    app.post('/webhook-url', (req, res) => {
        console.log('url: /webhook-test received: ', req.body.message)
    });

    const users = require('../controllers/users.controller');
    app.get('/users', users.find);
    app.post('/users', users.create);
    app.post('/auth', users.auth);
    app.post('/logout', users.logout);
    app.post('/value', users.value);

    app.post('/search/', (req, res) => {
        if (req.body.walletAddr === undefined/* || req.headers.authent === undefined*/) {
            return res.send({
                status: false,
                message: "Wallet Address can not be empty"
            });
        }
    
        /*Users.find({publicAddress: req.body.walletAddr.toLowerCase(), jwtToken: req.headers.authent})
        .then(users => {
            if (users.length > 0) {*/
                if (!req.body.name) {
                    return res.status(400).send({
                        message: "Search name can not be empty"
                    });
                }
        
                if (config.TOKEN_SEARCH_MODE === 1) {
                    const url = 'https://bscscan.com/searchHandler?term=' + encodeURIComponent(req.body.name) + '&filterby=0'
                    axios.get(url).then((res) => res.data)
                    .then((val) => {
                        let tokenArray = [];
                        if (val.length > 0) {
                            if (val[0].indexOf('Tokens') >= 0) {
                                val.map((item) => {
                                    item = item.split("\t");
                                    if (item[1] !== "")
                                        tokenArray.push({name: item[0], addr: item[1]})
                                });
                                res.send({result: tokenArray})
                            } else if (val[0].indexOf('Addresses') >= 0) {
                                let it = val[1].split("\t");
                                tokenArray.push({name: "", addr: it[0]})
                                res.send({result: tokenArray})
                            }
                        } else {
                            res.send({result: []})
                        }
                    })
                    .catch(error => console.log(error))

                } else if (config.TOKEN_SEARCH_MODE === 2) {
                    const query = `{
                        search(
                          string: "` + req.body.name + `"
                          network: bsc
                          limit: 50
                        ) {
                          network {
                            network
                          }
                          subject {
                            ... on Currency {
                              name
                              symbol
                              address
                              tokenType
                            }
                          }
                        }
                      }`
                        
                    const bitqueryKey = config.BITQUERY_KEYS[Math.floor(Math.random() * config.BITQUERY_KEYS.length)]
                    const url = "https://graphql.bitquery.io/";
                    const opts = {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-API-KEY": bitqueryKey
                        },
                        body: JSON.stringify({
                            query: query
                        })
                    };
        
                    fetch(url, opts)
                    .then(res => res.json())
                    .then((val) => {
                        val = val.data;
                        if (val && val.search && val.search.length > 0) {
                            let tokenArray = [];
                            val.search.map((item) => {
                                if (item.subject && item.subject.tokenType && item.subject.tokenType === "ERC20") {
                                    tokenArray.push({name: item.subject.name + ' (' + item.subject.symbol + ')', addr: item.subject.address})
                                }
                            });
                            res.send({result: tokenArray})
                        } else {
                            res.send({result: []})  
                        }
                    })
                }
            /*} else {
                return res.send({
                    status: false,
                    message: "Invalid api call"
                });
            }
        })*/

        
    })

    app.post('/tierinfo/', (req, res) => {
        if (req.body.walletAddr === undefined || req.headers.authent === undefined) {
            return res.send({
                status: false,
                message: "Wallet Address can not be empty"
            });
        }
    
        Users.find({publicAddress: req.body.walletAddr.toLowerCase(), jwtToken: req.headers.authent})
        .then(users => {
            if (users.length > 0) {
                return res.send({
                    status: true,
                    message: config.TIER_INFO
                });
            } else {
                return res.send({
                    status: false,
                    message: "Invalid api call"
                });
            }
        })

        
    })
}
