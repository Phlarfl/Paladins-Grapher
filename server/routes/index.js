const express = require('express');

const router = express.Router();

const routes = [
    ...require('./api.route')
];

routes.forEach((route) => {
    router[route.method.toLowerCase()](route.url, route.controller);
});

module.exports = router;