// index.js
const path = require('path')
const express = require('express')
const exphbs = require('express-handlebars')
const app = express()
const port = 3000

var connected = 0;

/* Readying to listen on the given port */
app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})

// Setting up the render engine
app.engine('.hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views/layouts'),
}))
app.set('view engine', '.hbs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.static(path.join(__dirname, 'public/css')));

/* Updating the HTML with the name variable */
app.get('/', (request, response) => {
  connected += 1;

  var apologyString = ""
  if (connected >= 5) { apologyString = 'We apologize for the long wait!'}

  response.render('home', {
    queueLoc: connected,
    apology: apologyString
  })
})