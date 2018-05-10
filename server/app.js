const express = require('express')
const path = require('path')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const app = express()
const PORT = 3000
const http = require('http')
const server = http.createServer(app);
const io = require('socket.io')(server);

app.use(morgan('dev'))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

// Static middleware
app.use(express.static(path.join(__dirname, '..', 'public')))

app.get('/*', (req, res, next) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'))
})


app.use((req, res, next) => {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})


app.use((err, req, res, next) => {
  res.status(err.status || 500)
  res.send(err.message || 'Internal server error')
})
const canvasWidth = 480
const canvasHeight = 320
const radius = 10
let i = 1
let playerName = 'Player ' + i
const gameState = {
  players: {},
  coin: {
    x: 200,
    y: 200,
    radius: 10
  }
}


io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);
  socket.emit('playerId', socket.id)
	socket.on('disconnect', function() {
    console.log('user disconnected');
    delete gameState.players[socket.id]
  });
  
  socket.on('newPlayer', () => {
    gameState.players[socket.id] = {
      x: 250,
      y: 250,
      width: 25,
      height: 25,
      score: 0,
      name: playerName
    }
    i++
    playerName = 'Player ' + i
  })

  socket.on('playerMovement', (playerMovement) => {
    const player = gameState.players[socket.id]
    const canvasWidth = 480
    const canvasHeight = 320
    if (playerMovement.left && player.x > 0) {
      player.x -= 4
    }
    if (playerMovement.right && player.x < canvasWidth - player.width) {
      player.x += 4
    }
    if (playerMovement.up && player.y > 0) {
      player.y -= 4
    }
    if (playerMovement.down && player.y < canvasHeight - player.height) {
      player.y += 4
    }
  })

  socket.on('collision', () => {
    gameState.coin.x = Math.random() * (canvasWidth - 2 * radius) + radius;
    gameState.coin.y = Math.random() * (canvasHeight - 2 * radius) + radius;
    gameState.players[socket.id].score++
  })
});

setInterval(function() {
  io.sockets.emit('state', gameState);
}, 1000 / 60);

server.listen(PORT, () => {
	console.log('Server is live on PORT:', PORT);
});