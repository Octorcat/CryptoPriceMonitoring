const Alert = require('../models/alert.model.js');
const Message = require('../models/message.model.js')
const Users = require('../models/user.model.js')

// Create and Save a new Alert
exports.save = (req, res) => {
    // Validate request
    if (req.body.walletAddr === undefined || req.headers.authent === undefined) {
        return res.send({
            status: false,
            message: "Wallet Address or auth can not be empty"
        });
    }

    Users.find({publicAddress: req.body.walletAddr.toLowerCase(), jwtToken: req.headers.authent})
    .then(users => {
        if (users.length > 0) {
            if (req.body.tokenName === undefined) {
                return res.send({
                    status: false,
                    message: "Token Name can not be empty"
                });
            }

            if (req.body.tokenSymbol === undefined) {
                return res.send({
                    status: false,
                    message: "Token Symbol can not be empty"
                });
            }
        
            if (req.body.tokenAddr === undefined) {
                return res.send({
                    status: false,
                    message: "Token Address can not be empty"
                });
            }
        
            if (req.body.channel === undefined) {
                return res.send({
                    status: false,
                    message: "Channel can not be empty"
                });
            }
        
            if (req.body.price === undefined) {
                return res.send({
                    status: false,
                    message: "Price can not be empty"
                });
            }
        
            if (req.body.when === undefined) {
                return res.send({
                    status: false,
                    message: "Condition can not be empty"
                });
            }
        
            if (req.body.time === undefined) {
                return res.send({
                    status: false,
                    message: "Time can not be empty"
                });
            }
        
            if (req.body.status === undefined) {
                return res.send({
                    status: false,
                    message: "Status can not be empty"
                });
            }
        
            if (req.body.default === undefined) {
                return res.send({
                    status: false,
                    message: "Default value can not be empty"
                });
            }

            if (req.body.maxDays === undefined) {
                return res.send({
                    status: false,
                    message: "maxDays can not be empty"
                });
            }
        
            const alert = new Alert({
                walletAddr: req.body.walletAddr,
                tokenName: req.body.tokenName,
                tokenSymbol: req.body.tokenSymbol,
                tokenAddr: req.body.tokenAddr,
                channel: req.body.channel,
                price: req.body.price,
                when: req.body.when,
                time: req.body.time,
                status: req.body.status,
                contactInfo: req.body.contactInfo,
                default: req.body.default
            });
        
            // Save Alert in the database
            Alert.find({walletAddr: req.body.walletAddr, tokenAddr: req.body.tokenAddr})
            .then(data => {
                //allow multiple alerts for same token
                /*if (data.length > 0) {
                    return res.send({status: false, message: "already exists"})
                } else {*/
                    alert.save()
                    .then(data => {
                        return res.send({status: true, message: data});
                    }).catch(err => {
                        return res.send({
                            status: false,
                            message: err.message || "Some error occurred while creating the alert."
                        });
                    });
                //}
            })
        } else {
            return res.send({
                status: false,
                message: "Invalid api call"
            });
        }
    })
};

exports.saveDefault = (req, res) => {
  if (req.body.walletAddr === undefined || req.headers.authent === undefined || req.body.default === undefined || req.body.contactInfo === undefined) {
    return res.send({
        status: false,
        message: "Wallet Address or auth, default , contactInfo can not be empty"
    });
  }

  const alt = new Alert({
      walletAddr: req.body.walletAddr,
      contactInfo: req.body.contactInfo,
      default: 1
  })

  alt.save().then(res => {
    console.log('result ', res);
  })
}

exports.remove = (req, res) => {
    if (req.body.walletAddr === undefined || req.headers.authent === undefined) {
        return res.send({
            status: false,
            message: "Wallet Address or auth can not be empty"
        });
    }
    Users.find({publicAddress: req.body.walletAddr.toLowerCase(), jwtToken: req.headers.authent})
    .then(users => {
        if (users.length > 0) {
            if (req.body.tokenAddr === undefined) {
                return res.send({
                    status: false,
                    message: "Token Address can not be empty"
                });
            }

            if (req.body._id === undefined) {
                return res.send({
                    status: false,
                    message: "alert id can not be empty"
                });
            }

            Alert.find(req.body)
            .then(alts => {
                Alert.deleteMany(req.body)
                .then(delRes => {
                    res.send({status: true, message: "ok"})
                    
                    if (alts.length > 0 && alts[0].default === 1) {
                        const alt = new Alert({
                            walletAddr: req.body.walletAddr,
                            contactInfo: alts[0].contactInfo,
                            default: 1
                        })
                        alt.save().then(res => {
                            //console.log(res);
                            }
                        );
                    }
                })
                Message.deleteMany({'WALLET ADDRESS': req.body.walletAddr, 'TOKEN ADDRESS': req.body.tokenAddr, 'ALERT ID': req.body._id})
                .then()
            })
        } else {
            return res.send({
                status: false,
                message: "Invalid api call"
            });
        }
    })
};

exports.read = (req, res) => {
    if (req.body.walletAddr === undefined || req.headers.authent === undefined) {
        return res.send({
            status: false,
            message: "Wallet Address or auth can not be empty"
        });
    }
    Users.find({publicAddress: req.body.walletAddr.toLowerCase(), jwtToken: req.headers.authent})
    .then(users => {
        if (users.length > 0) {
            if (req.body.tokenAddr === undefined) {
                if (req.body.default !== undefined) {
                    Alert.find(req.body)
                    .then(data => {
                        if (data.length > 0) {
                            res.send({status: true, message: data[0]});
                        } else {
                            return res.send({
                                status: false,
                                message: "not found"
                            })
                        }
                    }).catch(err => {
                        return res.send({
                            status: false,
                            message: err.message || "Some error occurred while creating the User."
                        });
                    });
                } else {
                    return res.send({
                        status: false,
                        message: "Token Address can not be empty"
                    });
                }
            } else {
                Alert.find(req.body)
                .then(data => {
                    if (data.length > 0) {
                        Message.find({'WALLET ADDRESS': req.body.walletAddr, 'TOKEN ADDRESS': req.body.tokenAddr, 'ALERT ID': req.body._id})
                        .then(msgData => {
                            if (msgData.length > 0) {
                                res.send({status: true, message: data[0], lastTrigged: msgData[0]['TIMESTAMP'], failedCallTimes: msgData[0]['FAILED CALLTIMES'], failedSmsTimes: msgData[0]['FAILED SMSTIMES']});
                            } else {
                                res.send({status: true, message: data[0]});
                            }
                        })
                        
                    } else {
                        return res.send({
                            status: false,
                            message: "not found"
                        })
                    }
                }).catch(err => {
                    return res.send({
                        status: false,
                        message: err.message || "Some error occurred while creating the User."
                    });
                });
            }
        } else {
            return res.send({
                status: false,
                message: "Invalid api call"
            });
        }
    })
};

exports.update = (req, res) => {
    if (req.body.walletAddr === undefined || req.headers.authent === undefined) {
        return res.send({
            status: false,
            message: "Wallet Address or auth can not be empty"
        });
    }

    Users.find({publicAddress: req.body.walletAddr.toLowerCase(), jwtToken: req.headers.authent})
    .then(users => {
        if (users.length > 0) {
            if (req.body.tokenAddr === undefined) {
                if (req.body.contactInfo !== undefined) {
                    Alert.updateMany({walletAddr: req.body.walletAddr}, req.body)
                    .then(user => {
                        return res.send({status: true, message: "ok"})
                    })
                } else if (req.body.default !== undefined) {
                    Alert.updateMany({walletAddr: req.body.walletAddr}, req.body)
                    .then(user => {
                        return res.send({status: true, message: "ok"})
                    })
                } else {
                    return res.send({
                        status: false,
                        message: "Token Address can not be empty"
                    });
                }
            } else {
                Alert.updateMany({walletAddr: req.body.walletAddr, tokenAddr: req.body.tokenAddr, _id: req.body._id}, req.body)
                .then(user => {
                    return res.send({status: true, message: "ok"})
                })
                Message.deleteMany({'WALLET ADDRESS': req.body.walletAddr, 'TOKEN ADDRESS': req.body.tokenAddr, 'ALERT ID': req.body._id})
                .then()
            }
        } else {
            return res.send({
                status: false,
                message: "Invalid api call"
            });
        }
    })
};

exports.all = (req, res) => {
    if (req.body.walletAddr === undefined || req.headers.authent === undefined) {
        return res.send({
            status: false,
            message: "Wallet Address can not be empty"
        });
    }

    Users.find({publicAddress: req.body.walletAddr.toLowerCase(), jwtToken: req.headers.authent})
    .then(users => {
        if (users.length > 0) {
            Alert.find({walletAddr: req.body.walletAddr})
            .then(data => {
                if (data.length > 0) {
                    res.send({status: true, message: data.filter(el => el.tokenAddr !== undefined)})
                } else {
                    return res.send({
                        status: false,
                        message: "no alert"
                    });
                }
            })
        } else {
            return res.send({
                status: false,
                message: "Invalid api call"
            });
        }
    })
};

exports.price = (req, res) => {
    if (req.body.walletAddr === undefined || req.headers.authent === undefined) {
        return res.send({
            status: false,
            message: "Wallet Address can not be empty"
        });
    }

    Users.find({publicAddress: req.body.walletAddr.toLowerCase(), jwtToken: req.headers.authent})
    .then(users => {
        if (users.length > 0) {
            Message.find({'TOKEN ADDRESS': req.body.tokenAddr})
            .then(data => {
                if (data.length > 0) {
                    res.send({status: true, message: data.filter(el => el['CURRENT PRICE'] !== undefined)})
                } else {
                    return res.send({
                        status: false,
                        message: "no current price"
                    });
                }
            })
        } else {
            return res.send({
                status: false,
                message: "Invalid api call"
            });
        }
    })
};

exports.unsubscribe = (req, res) => {
    Alert.deleteMany({_id: req.body.alertId})
    .then(res => {
        console.log(res)
    })
};

