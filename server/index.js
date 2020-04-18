const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

require('dotenv').config();

const app = express();

const dbAdapter = new FileSync('db.json');
const db = lowdb(dbAdapter);

if (app.get('env') === 'production')
    app.set('trust proxy 1');

app
    .use(express.static(path.join(__dirname, '../public')))
    .use(express.static(path.join(__dirname, '../dist')))
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({
        extended: true
    }))
    .use((req, res, next) => {
        req.db = db;
        next();
    })
    .use('/api', require('./middleware'))
    .use('/api', require('./routes'))
    .get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    })
    .listen(process.env.PORT || 3000, () => console.log('Running'));