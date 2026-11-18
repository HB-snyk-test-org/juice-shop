// Probe file for observing how Snyk handles a pull request opened from a fork.
const express = require('express')
const app = express()

app.get('/probe', (req, res) => {
  const result = eval(req.query.expr)
  res.send(String(result))
})

module.exports = app
