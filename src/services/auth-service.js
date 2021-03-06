'use strict';

import jwt from 'jsonwebtoken';
import { secretKey, mongoDB, users } from '../../config';

const { collections: { userCollection } } = mongoDB;
const { accountTypes: { admin, standard } } = users;

// TODO: Set an expiration data to token
export function generateToken(userInfo) {
    const newToken = {
        userName: userInfo.name,
        expDate: 'date script',
        tokenType: 'standard',
    };

    return new Promise((resolve, reject) => {
        try {
            resolve(jwt.sign(newToken, secretKey));
        } catch (err) {
            const error = {
                Error: `Could Not Generate Token: ${err}`,
            };
            reject(error);
        }
    });
}

export function verifyToken(req, res, next) {
    if (req.path === '/token' || req.path === '/info') {
        next();
        return;
    }
    if (!req.headers.authorization) {
        res.status(400).send({
            Error: 'Missing Authorization Header',
        });
        return;
    }

    const token = req.headers.authorization;
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            res.status(400).send({ Error: 'Invalid Token' });
            return;
        }
        req.body.decoded = decoded;
        next();
    });
}

export function verifyCredentials(db, credentials) {
    const { userName, hash } = credentials;

    return new Promise((resolve, reject) => {
        db.collection(userCollection).findOne({ userName }, (err, doc) => {
            if (!doc) {
                const error = { Error: 'Username Not Found' };
                reject(error);
                return;
            }

            if (doc.userName === userName && doc.hash === hash) {
                resolve({
                    userName: doc.userName,
                    firstName: doc.firstName,
                    lastName: doc.lastName,
                    email: doc.email,
                    favorites: doc.favorites,
                    createdDate: doc.createdDate,
                    comments: doc.comments,
                });
                return;
            }
            const error = { Error: 'Invalid Credentials' };
            reject(error);
        });
    });
}
