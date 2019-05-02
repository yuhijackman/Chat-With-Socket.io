const path = require('path')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const Filter =  require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)
const port = process.env.PORT
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

let count = 0
io.on('connection', (socket) => {
    console.log('New web socket connection')

    socket.on('join', (options, callback) => {
        const {error, user} = addUser({id: socket.id, ...options})

        if (error) {
            return callback(error)
        }
        socket.join(user.room)

        socket.emit('shareMessage', generateMessage(user.username, 'Welcome'))
        socket.broadcast.to(user.room).emit('shareMessage', generateMessage(`${user.username} has joined`))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed.')
        }
        io.to(user.room).emit('shareMessage', generateMessage(user.username, message))
        callback()
    })

    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id)
        const url = `https://www.google.com/maps?q=${location.longitude},${location.latitude}`
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, url))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('shareMessage', generateMessage(user.username, `${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        } 
    })
})

server.listen(port, () => {
    console.log(`Server is up and running on port ${port}!`)
})