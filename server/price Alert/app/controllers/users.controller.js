const Users = require('../models/user.model.js');
const etherUtils = require('ethereumjs-util');
const ethSigUtil = require('eth-sig-util');
const jwt = require('jsonwebtoken');
const config =  require('../../config')

exports.create = (req, res) => {
    if (req.body.publicAddress === undefined) {
        return res.send({
            status: false,
            message: "public Address can not be empty"
        });
    }
    const user = new Users({
        publicAddress: req.body.publicAddress,
        nonce: Math.floor(Math.random() * 10000).toString(),
        jwtToken: Math.floor(Math.random() * 10000).toString()
    })
    user.save()
    .then((user) => {
		let userToSend = {publicAddress: user.publicAddress, nonce: user.nonce}
		res.json(userToSend)
	})
}

exports.find = (req, res, next) => {
	// If a query string ?publicAddress=... is given, then filter results
	if (req.query && req.query.publicAddress) {
		const whereClause = {publicAddress: req.query.publicAddress}

		return Users.find(whereClause)
			.then((users) => {
				let usersToSend = []
				for (let i = 0; i < users.length; i++) {
					usersToSend[i] = {publicAddress: users[i].publicAddress, nonce: users[i].nonce}
				}
				res.json(usersToSend)
			})
			.catch(next);
	} else {
		return res.send({
            status: false,
            message: "public address required"
        });
	}
};

exports.auth = (req, res, next) => {
	const { signature, publicAddress } = req.body;
	if (!signature || !publicAddress)
        return res.send({
            status: false,
            message: "Some error occurred during auth"
        });

	return (
		Users.find({publicAddress})
			// Step 1: Get the user with the given publicAddress
			.then((user) => {
				if (!user) {
					res.send({
                        status: false,
                        message: "Some error occurred during auth"
                    });
                    return null;
				}
				return user[0];
			})
			// Step 2: Verify digital signature
			.then((user) => {
				if (!(user instanceof Users)) {
					// Should not happen, we should have already sent the response
					res.send({
                        status: false,
                        message: "Some error occurred during auth"
                    });
                    return null;
				}

				const msg = `Signing for connecting wallet: ${user.nonce}`;

				// We now are in possession of msg, publicAddress and signature. We
				// will use a helper from eth-sig-util to extract the address from the signature
				const msgBufferHex = etherUtils.bufferToHex(Buffer.from(msg, 'utf8'));
				const address = ethSigUtil.recoverPersonalSignature({
					data: msgBufferHex,
					sig: signature,
				});

				// The signature verification is successful if the address found with
				// sigUtil.recoverPersonalSignature matches the initial publicAddress
				if (address.toLowerCase() === publicAddress.toLowerCase()) {
					return user;
				} else {
					res.send({
                        status: false,
                        message: "Some error occurred during auth"
                    });
                    return null;
				}
			})
			// Step 3: Generate a new nonce for the user
			.then((user) => {
				if (!(user instanceof Users)) {
					// Should not happen, we should have already sent the response
                    res.send({
                        status: false,
                        message: "Some error occurred during auth"
                    });
                    return null;
				}

				let newNonce = Math.floor(Math.random() * 10000);
                Users.updateMany({publicAddress: req.body.publicAddress}, {nonce: newNonce})
                .then(() => {
                    //res.send({status: true, message: "ok"})
                    //return true;
					return null
                })
			})
			// Step 4: Create JWT
			.then(() => {
				return new Promise((resolve, reject) =>
					// https://github.com/auth0/node-jsonwebtoken
					jwt.sign(
						{
							payload: {
								id: Math.floor(Math.random() * 10000).toString(),
								publicAddress,
							},
						},
						config.SECURITY_PHRASE,
						{
							algorithm: config.HASH_ALGORITHM[0],
						},
						(err, token) => {
							if (err) {
								return reject(err);
							}
							if (!token) {
								return new Error('Empty token');
							}
							return resolve(token);
						}
					)
				);
			})
			.then((accessToken) => {
                Users.updateMany({publicAddress: req.body.publicAddress}, {jwtToken: accessToken})
                .then(res.json({ accessToken }))
            })
			.catch(next)
	);
};

exports.logout = (req, res, next) => {
	if (req.body.walletAddr === undefined || req.headers.authent === undefined) {
        return res.send({
            status: false,
            message: "Wallet Address can not be empty"
        });
    }

    Users.find({publicAddress: req.body.walletAddr.toLowerCase(), jwtToken: req.headers.authent})
    .then(users => {
		if (users.length > 0) {
			return new Promise((resolve, reject) =>
				// https://github.com/auth0/node-jsonwebtoken
				jwt.sign(
					{
						payload: {
							id: Math.floor(Math.random() * 10000).toString(),
							publicAddress,
						},
					},
					config.SECURITY_PHRASE,
					{
						algorithm: config.HASH_ALGORITHM[0],
					},
					(err, token) => {
						if (err) {
							return reject(err);
						}
						if (!token) {
							return new Error('Empty token');
						}
						return resolve(token);
					}
				)
			);
			
		}
	}).then((accessToken) => {
		Users.updateMany({publicAddress: req.body.walletAddr}, {jwtToken: accessToken})
		.then(res.json({ status: true, message: "ok" }))
	})
};

exports.value = (req, res, next) => {
	if (req.body.walletAddr === undefined || req.headers.authent === undefined) {
        return res.send({
            status: false,
            message: "Wallet Address can not be empty"
        });
    }

    Users.findOne({publicAddress: req.body.walletAddr.toLowerCase(), jwtToken: req.headers.authent})
    .then(user => {
		if (user && user.createdAt) {
			let created = new Date(user.createdAt)
			let curr = new Date()

			return res.send({status: true, message: {walletValue: user.walletValue}})

		} else {
			return res.send({status: false, message: "invalid jwt or wallet address"})
		}
	}).catch((err) => {
		return res.send({status: false, message: "fetch error"})
	})
};