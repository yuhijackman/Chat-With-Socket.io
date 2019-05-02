const generateMessage = (username, text) => {
    return {
        username,
        text,
        createdAt: new Date().getTime()
    }
}

const locationMessage = (url) => {
    return {
        url,
        createdAt: new Data().getTime.format('h:mm a')
    }
}

module.exports = {
    generateMessage,
    locationMessage
}