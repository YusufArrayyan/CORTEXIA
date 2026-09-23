const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'feedback.routes.js endpoints - to be implemented' });
});

module.exports = router;
