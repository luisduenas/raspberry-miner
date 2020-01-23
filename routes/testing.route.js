const express = require('express');
const router = express.Router();
const testing_controller = require('../controllers/testing.controller');

// test
router.get('/test', testing_controller.test);

module.exports = router;