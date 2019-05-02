const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const $messageTemplate = document.querySelector('#message-template').innerHTML
const $locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const $sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
    // New message Element
    const $newMessage = $messages.lastElementChild
    // Height OF New message
    const $newMessageStyles = getComputedStyle($newMessage)
    const $newMessageMargin = parseInt($newMessageStyles.marginBottom)
    const $newMessageHeight = $newMessage.offsetHeight + $newMessageMargin

    // visible height
    const $visibleHeight = $messages.offsetHeight
    const $containerHeight = $messages.scrollHeight
    
    // How far I scrolled
    const $scrollOffset = $messages.scrollTop + $visibleHeight

    if ($containerHeight - $newMessageHeight <= $scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }

}

socket.on('shareMessage', (message) => {
    console.log(message)
    const html = Mustache.render($messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage', (message) => {
    const html = Mustache.render($locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

$messageForm.addEventListener('submit', (event) => {
    event.preventDefault()
    $messageFormButton.setAttribute('disabled', 'disabled')
    message = event.target.elements.message.value
    socket.emit('sendMessage', message, (error) =>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value=''
        $messageFormInput.focus()
        if (error) {
            return console.log(error)
        }
        console.log('Message has been delivered.')
    })
})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }
    $sendLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        const location = {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude
        }
        socket.emit('sendLocation', location, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location has been shared.')
        })
    })
})

socket.on('roomData', ({users, room}) => {
    const html = Mustache.render($sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
}) 