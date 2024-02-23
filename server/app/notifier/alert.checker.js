const Alert = require('../models/alert.model.js');
const Users = require('../models/user.model.js');
const Message = require('../models/message.model.js');
const Cron = require('node-cron');
const fetch = require("node-fetch")
const config =  require('../../config')
const nodemailer = require('nodemailer');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class AlerChecker {
    constructor() {
        this.intervalAlert
        this.allTokens = [];
        this.allAlerts = [];
    }

    async run() {
        //create mail transporter
        this.transporter = nodemailer.createTransport({
            service: config.EMAIL_SERVICE,
            auth: {
                user: config.EMAIL,
                pass: config.EMAIL_PWD
            }
        });

        //create twilio client
        try {
            this.twilioClient = require('twilio')(config.TWILIO_SID, config.TWILIO_AUTH_TOKEN);  
        } catch (error) {
        }
        

        let _this = this;

        //Get alert total price and save in database Everyday
        Cron.schedule('0 59 23 * * *', async function() {
            let wallets = await Users.find({})
            for (let i = 0; i < wallets.length; i++) {
                let walletValue = {};
                const element = wallets[i].publicAddress;
                if (!element) {
                    continue;
                }
                const queryBalance = `{
                    ethereum(network: bsc) {
                      address(address: {is: "`+ element + `"}) {
                        balances {
                          value
                          currency {
                            symbol
                            address
                          }
                        }
                      }
                    }
                  }
                  `
                const bitqueryKey = config.BITQUERY_KEYS[Math.floor(Math.random() * config.BITQUERY_KEYS.length)]
                const url = "https://graphql.bitquery.io/";
                const opts = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-API-KEY": bitqueryKey
                    },
                    body: JSON.stringify({
                        query: queryBalance
                    })
                };
    
                let walletTokens = []
                let res = await fetch(url, opts)
                res = await res.json()
                if (res) {
                    if (res.data && res.data.ethereum && res.data.ethereum.address && res.data.ethereum.address.length > 0) {
                        if (res.data.ethereum.address[0].balances) {
                            walletTokens = res.data.ethereum.address[0].balances
                        }
                    }

                    if (walletTokens.length > 0) {
                        let strTokens = '';
                        let strTokenInfos = '';
                        let strVals = '';
                        
                        for (let index = 0; index < walletTokens.length; index++) {
                            strTokens = strTokens + 
                            `$token` + index + `: String!, 
                            `;
                            strTokenInfos = strTokenInfos + `token` + index + `: dexTrades(
                                exchangeName: {is: "Pancake v2"}
                                options: {limit: $limit, asc: "quoteCurrency.symbol"}
                                baseCurrency: {is: $token`+ index + `}
                                quoteCurrency: {is: $wbnb}
                            ) {
                                quoteCurrency {
                                symbol
                                name
                                address
                                }
                                baseCurrency {
                                symbol
                                address
                                name
                                }
                                quotePrice
                                close: maximum(of: block, get: quote_price)
                            }`
                            strVals = strVals + 
                            `"token` + index + `": "` + walletTokens[index].currency.address +`", 
                            `;              
                        }

                        const query = `query (
                            $network: EthereumNetwork!, 
                            $wbnb: String!, 
                            ` + strTokens + `$busd: String!, 
                            $limit: Int!,
                        ) {
                            ethereum(network: $network) {
                            ` + strTokenInfos + `
                            base0: dexTrades(
                                exchangeName: {is: "Pancake v2"}
                                options: {limit: $limit, asc: "quoteCurrency.symbol"}
                                quoteCurrency: {is: $busd}
                                baseCurrency: {is: $wbnb}
                            ) {
                                quoteCurrency {
                                symbol
                                name
                                address
                                }
                                baseCurrency {
                                symbol
                                address
                                name
                                }
                                close: maximum(of: block, get: quote_price)
                            }
                            }
                        }`;

                        const variable = `{
                            "limit": 1,
                            "network": "bsc",
                            ` + strVals + `"busd": "0xe9e7cea3dedca5984780bafc599bd69add087d56",
                            "wbnb": "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c"
                        }`;
                            
                        const bitqueryKey = config.BITQUERY_KEYS[Math.floor(Math.random() * config.BITQUERY_KEYS.length)]
                        const url = "https://graphql.bitquery.io/";
                        const opts = {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "X-API-KEY": bitqueryKey
                            },
                            body: JSON.stringify({
                                query: query, variables: variable
                            })
                        };

                        await sleep(5000);

                        let res = await fetch(url, opts)
                        res = await res.json()
                        if (res) {
                            if (res &&  res.data && res.data.ethereum) {
                                let bitObj = res.data.ethereum;
                                //loop for all checked tokens
                                let walletPriceInfo = [];
                                for (let i = 0; i < walletTokens.length; i++) {
                                    let itemName = 'token' + i;
                                    //bitquery "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c" -> "-"
                                    if ((walletTokens[i].currency.address === "-") || (bitObj[itemName] && bitObj[itemName][0] && bitObj['base0'] && bitObj['base0'][0])) {
                                        const currPrice =  (walletTokens[i].currency.address === "-") ? Number(bitObj['base0'][0].close) : bitObj[itemName][0].close * bitObj['base0'][0].close;
                                        const val = walletTokens[i].value;
                                        console.log(walletTokens[i].currency.address, currPrice * val);
                                        const addr = walletTokens[i].currency.address === "-" ? "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c" : walletTokens[i].currency.address;
                                        walletValue[addr] = currPrice * val;
                                    }
                                }
                            }
                        }

                    }
                }

                Users.findOne({publicAddress: element})
                .then(res => {
                    if (res.walletValue.length > 30) {
                        res.walletValue.shift()
                    }
                    res.walletValue.push(walletValue)
                    res.save()
                })
                
                await sleep(15000);
            }
        });
        
        //Get all token address every 60 seconds
        Cron.schedule('*/'+ config.ALERT_CHECK_INTERVAL + ' * * * * *', async function () {
            _this.allTokens = await _this.getEnabledTokenAddrs();
            _this.allAlerts = await _this.getEnabledAllAlerts();
        });

        //Get prices of all tokens every 20 seconds
        Cron.schedule('*/' + config.SEARCH_TOKEN_INTERVAL + ' * * * * *', function () {
            if (_this.allTokens.length <= 0 || _this.allAlerts.length <= 0)
                return;
            
            let tokens = _this.allTokens;
            let strTokens = '';
            let strTokenInfos = '';
            let strVals = '';
            
            for (let index = 0; index < tokens.length; index++) {
                strTokens = strTokens + 
                `$token` + index + `: String!, 
                `;
                strTokenInfos = strTokenInfos + `token` + index + `: dexTrades(
                    exchangeName: {is: "Pancake v2"}
                    options: {limit: $limit, asc: "quoteCurrency.symbol"}
                    baseCurrency: {is: $token`+ index + `}
                    quoteCurrency: {is: $wbnb}
                  ) {
                    quoteCurrency {
                      symbol
                      name
                      address
                    }
                    baseCurrency {
                      symbol
                      address
                      name
                    }
                    quotePrice
                    close: maximum(of: block, get: quote_price)
                  }`
                strVals = strVals + 
                `"token` + index + `": "` + tokens[index] +`", 
                `;              
            }

            const query = `query (
                $network: EthereumNetwork!, 
                $wbnb: String!, 
                ` + strTokens + `$busd: String!, 
                $limit: Int!,
            ) {
                ethereum(network: $network) {
                ` + strTokenInfos + `
                base0: dexTrades(
                    exchangeName: {is: "Pancake v2"}
                    options: {limit: $limit, asc: "quoteCurrency.symbol"}
                    quoteCurrency: {is: $busd}
                    baseCurrency: {is: $wbnb}
                  ) {
                    quoteCurrency {
                      symbol
                      name
                      address
                    }
                    baseCurrency {
                      symbol
                      address
                      name
                    }
                    close: maximum(of: block, get: quote_price)
                  }
                }
            }`;

            const variable = `{
                "limit": 10,
                "network": "bsc",
                ` + strVals + `"busd": "0xe9e7cea3dedca5984780bafc599bd69add087d56",
                "wbnb": "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c"
            }`;
                
            const bitqueryKey = config.BITQUERY_KEYS[Math.floor(Math.random() * config.BITQUERY_KEYS.length)]
            const url = "https://graphql.bitquery.io/";
            const opts = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-KEY": bitqueryKey
                },
                body: JSON.stringify({
                    query: query, variables: variable
                })
            };

            fetch(url, opts)
            .then(res => res.json())
            .then((res) => {
                if (res !== undefined &&  res.data !== undefined && res.data.ethereum) {
                    let bitObj = res.data.ethereum;
                    //loop for all checked tokens
                    for (let i = 0; i < tokens.length; i++) {
                        let itemName = 'token' + i;
                        let alerts = [];
                        if (tokens[i].toLowerCase() === "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c") {
                            alerts = _this.allAlerts.filter(item => item.tokenAddr === "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c")
                        } else if (bitObj[itemName] !== undefined && bitObj[itemName] !== null && bitObj[itemName][0] !== undefined && bitObj[itemName][0].close !== undefined) {
                            alerts = _this.allAlerts.filter(item => item.tokenAddr === bitObj[itemName][0].baseCurrency.address);
                        }

                        //checking for every target alerts whose token addr is above
                        for (let j = 0; j < alerts.length; j++) {
                            if (bitObj['base0'] && bitObj['base0'][0]) {
                                const al = alerts[j];
                                const currPrice =  (al.tokenAddr === "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c") ? Number(bitObj['base0'][0].close) : ((bitObj[itemName] && bitObj[itemName][0]) ? bitObj[itemName][0].close * bitObj['base0'][0].close : 0);
                                if (al.when > 0) {
                                    if (al.price < currPrice) {
                                        _this.updateMessage(al, currPrice);
                                    }
                                } else {
                                    if (al.price > currPrice) {
                                        _this.updateMessage(al, currPrice);
                                    }
                                }
                            }
                        }
                    }
                }    
            })
            
        });
    }

    updateMessage(alert, currentPrice) {
        let timestamp = new Date().getTime();
        var msgObj = {'ALERT ID': alert._id,
            'TOKEN NAME': alert.tokenName,
            'SYMBOL': alert.tokenSymbol,
            'TOKEN ADDRESS': alert.tokenAddr,
            'CURRENT PRICE': currentPrice,
            'ALERT PRICE': alert.price,
            'WALLET ADDRESS': alert.walletAddr,
            'TIMESTAMP': timestamp
        };

        Message.find({'WALLET ADDRESS': alert.walletAddr, 'TOKEN ADDRESS': alert.tokenAddr, 'ALERT ID': alert._id})
        .then((res) => {
            if (res.length > 0) {
                if (res[0]['TIMESTAMP'] !== undefined) {
                    //checking timestamp
                    let duration = (timestamp - res[0]['TIMESTAMP']) / 1000;
                    if (alert.time === 0 && duration > config.EVERY_TIME) {
                        if (alert.createdAt && alert.maxDays <= config.TIER_INFO.max_possible_days) {
                            let created = new Date(alert.createdAt)
                            let curr = new Date()
                            if ((curr.getTime() - created.getTime()) <= 1000 * 3600 * 24 * alert.maxDays) {
                                //sending email every time
                                Message.updateMany({'WALLET ADDRESS': alert.walletAddr, 'TOKEN ADDRESS': alert.tokenAddr, 'ALERT ID': alert._id}, msgObj)
                                .then(result => {
                                    //console.log(result)
                                })
                                this.sendMessage(alert, msgObj)
                            }
                        }
                    } else if (alert.time === 2 && duration > 86400) { //1day -> 86400seconds
                        //sending email every day
                        if (alert.createdAt && alert.maxDays <= config.TIER_INFO.max_possible_days) {
                            let created = new Date(alert.createdAt)
                            let curr = new Date()
                            if ((curr.getTime() - created.getTime()) <= 1000 * 3600 * 24 * alert.maxDays) {
                                Message.updateMany({'WALLET ADDRESS': alert.walletAddr, 'TOKEN ADDRESS': alert.tokenAddr, 'ALERT ID': alert._id}, msgObj)
                                .then(result => {
                                    //console.log(result)
                                })
                                this.sendMessage(alert, msgObj)
                            }
                        }
                    } else if (alert.time === 1) {
                        Message.updateMany({'WALLET ADDRESS': alert.walletAddr, 'TOKEN ADDRESS': alert.tokenAddr, 'ALERT ID': alert._id}, msgObj)
                        .then(result => {console.log(result)})
                        this.sendMessage(alert, msgObj)
                    }
                }
            } else {
                let msg = new Message(msgObj);
                msg['FAILED CALLTIMES'] = 0,
                msg['FAILED SMSTIMES'] = 0,
                //sending email once
                msg.save();
                if (alert.time === 1) {
                    Alert.updateMany({walletAddr: alert.walletAddr, tokenAddr: alert.tokenAddr, _id: alert._id}, {status: -1})
                    .then(user => {
                        console.log(user, alert._id)
                    })
                }
                this.sendMessage(alert, msgObj)
            }
        })
    }

    twilioStatusUpdate(targetAlert, isFailed, isSms) {
        Message.findOne({'WALLET ADDRESS': targetAlert.walletAddr, 'TOKEN ADDRESS': targetAlert.tokenAddr, 'ALERT ID': targetAlert._id})
        .then(resData => {
            if (resData) {
                if (isSms) {
                    resData['FAILED SMSTIMES'] = isFailed ? resData['FAILED SMSTIMES'] + 1 : 0;
                } else {
                    resData['FAILED CALLTIMES'] = isFailed ? resData['FAILED CALLTIMES'] + 1 : 0;
                }
                
                if (resData['FAILED SMSTIMES'] >= 3 || resData['FAILED CALLTIMES'] >= 3) {
                    ///DISABLE
                    Alert.findOne({_id: targetAlert._id})
                    .then(res => {
                        res.status = -1;
                        res.save();
                    })
                }
                resData.save();
            }
        })
    }

    makeTemplateMsg(msgObj, i) {
        let msgToSend =  "";
        if (i === 0) {
            msgToSend = config.MESSAGE_TEMP_EMAIL;
        } else if (i === 1) {
            msgToSend = config.MESSAGE_TEMP_SMS;
        } else if (i === 2) {
            msgToSend = config.MESSAGE_TEMP_CALL;
        } else if (i === 3) {
            msgToSend = config.MESSAGE_TEMP_WEB;
        }
        
        msgToSend = msgToSend.replace('{ALERT ID}', 'alarm');
        msgToSend = msgToSend.replace('{TOKEN NAME}', msgObj['TOKEN NAME']);
        msgToSend = msgToSend.replace('{SYMBOL}', msgObj['SYMBOL']);
        msgToSend = msgToSend.replace('{TOKEN ADDRESS}', msgObj['TOKEN ADDRESS']);
        msgToSend = msgToSend.replace('{CURRENT PRICE}', msgObj['CURRENT PRICE'].toFixed(20).replace(/\.?0+$/, ""));
        msgToSend = msgToSend.replace('{ALERT PRICE}', msgObj['ALERT PRICE'].toFixed(20).replace(/\.?0+$/, ""));
        msgToSend = msgToSend.replace('{WALLET ADDRESS}', msgObj['WALLET ADDRESS']);
        msgToSend = msgToSend.replace('{TIMESTAMP}', Date(msgObj['TIMESTAMP']));
        return msgToSend;
    }

    sendMessage(targetAlert, msgObj) {
        if (targetAlert.contactInfo === undefined)
            return;

        if (targetAlert.contactInfo.email && targetAlert.contactInfo.email !== "") {
            let mailOptions = {
                from: config.EMAIL,
                to: targetAlert.contactInfo.email,
                subject: 'Crypto Alert',
                text: this.makeTemplateMsg(msgObj, 0) + ' To stop alert, please click here ' + config.SERVER_URL + '/unsubscribe/' + targetAlert._id
            };

            this.transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    //console.log(error);
                } else {
                    //console.log('Email sent: ' + info.response);
                }
            });
        }

        if (targetAlert.contactInfo.sms && targetAlert.contactInfo.sms !== "") {
            if (this.twilioClient) {
                try {
                    this.twilioClient.messages
                    .create({
                    body: this.makeTemplateMsg(msgObj, 1),
                    from: config.PHONE_NUMBER,
                    to: targetAlert.contactInfo.sms
                    })
                    .then(message => {
                        console.log('successful sending sms', message.sid)
                        this.twilioStatusUpdate(targetAlert, false, true)
                    })
                    .catch(err => {
                        console.log('sending sms failed:', err)
                        this.twilioStatusUpdate(targetAlert, true, true)
                    });
                } catch {
                    this.twilioStatusUpdate(targetAlert, true, true)
                }
            }
        }

        if (targetAlert.contactInfo.call && targetAlert.contactInfo.call !== "") {
            if (this.twilioClient) {
                try {
                    this.twilioClient.calls
                    .create({
                        twiml: '<Response><Say>' + this.makeTemplateMsg(msgObj, 2) + '</Say></Response>',
                        from: config.PHONE_NUMBER,
                        to: targetAlert.contactInfo.call,
                        timeout: 14
                    })
                    .then(message => {
                        console.log('successful sending call', message.sid)
                        this.twilioStatusUpdate(targetAlert, false, false)
                    })
                    .catch(err => {
                        console.log('sending call failed:', err)
                        this.twilioStatusUpdate(targetAlert, true, false)
                    });
                } catch {
                    this.twilioStatusUpdate(targetAlert, true, false)
                }
            }
        }

        if (targetAlert.contactInfo.webhook && targetAlert.contactInfo.webhook !== "") {
            try {
                fetch(targetAlert.contactInfo.webhook, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({message: this.makeTemplateMsg(msgObj, 3)})
                })
                .then()           
                .catch()
            } catch (error) {
            }
        }
    }

    async getEnabledTokenAddrs() {
        let res = await Alert.find({});
        if (res.length > 0) {
            let tokens = [];
            for (let i = 0; i < res.length; i++) {
                const el = res[i];
                let isExist = false;
                for (let j = 0; j < tokens.length; j++) {
                    if (el.tokenAddr === tokens[j].tokenAddr) {
                        isExist = true;
                        break;
                    }
                }
                if (isExist === false && (el.status !== undefined && el.status > 0)) {
                    tokens.push(el.tokenAddr);
                }
            }
            return tokens;
        } else {
            return [];
        }
    }

    async getAllWallets() {
        let res = await Alert.find({});
        if (res.length > 0) {
            let wallets = [];
            for (let i = 0; i < res.length; i++) {
                const el = res[i];
                let isExist = false;
                for (let j = 0; j < i; j++) {
                    if (el.walletAddr === res[j].walletAddr) {
                        isExist = true;
                        break;
                    }
                }
                if (isExist === false) {
                    wallets.push(el.walletAddr);
                }
            }
            return wallets;
        } else {
            return [];
        }
    }

    async getEnabledAllAlerts() {
        let res = await this.getAllWallets();
        let allAlerts = [];
        for (let index = 0; index < res.length; index++) {
            let resAlert = await Alert.find({ walletAddr: res[index] });
            if (resAlert.length > 0) {
                allAlerts = allAlerts.concat(resAlert);
            }
        }
        
        allAlerts = allAlerts.filter(item => item.status > 0);
        return allAlerts;
    }  
}

module.exports = AlerChecker;
