"use strict";
var setUsername;
var currentRoom = "Global";
function sanitize(string) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;',
    };
    const reg = /[&<>"'/]/ig;
    return string.replace(reg, (match) => (map[match]));
}
function startApp(username) {
    document.querySelector('.login')?.classList.add("d-none");
    document.querySelector('.app')?.classList.remove("d-none");
    // @ts-ignore
    const socket = io('ws://', {
        query: {
            username: username
        }
    });
    setUsername = username;
    socket.on('room-list', (data) => {
        document.querySelector('.rooms').innerHTML = "";
        data.rooms.forEach((item) => {
            let html = '<div class="room d-flex justify-content-center align-items-center border-bottom p-4 ' + (sanitize(item) == currentRoom ? 'bg-success-subtle' : '') + '">';
            html += '<div class="title">' + sanitize(item) + '</div>';
            html += '</div>';
            document.querySelector('.rooms').innerHTML += html;
        });
    });
    socket.on('message', (data) => {
        let date = (new Date()).toISOString().split("T")[0];
        let scopeColor = data.scope == 'user' ? 'bg-warning-subtle' : '';
        scopeColor = data.scope == 'room' ? 'bg-info-subtle' : scopeColor;
        scopeColor = data.scope == 'room' && data.room == "Global" ? 'bg-secondary-subtle' : scopeColor;
        let html = '<div class="card mb-3 ' + scopeColor + '">';
        html += '<div class="card-body">';
        html += '<div class="card-text">';
        html += '<blockquote class="blockquote mb-0">';
        html += '<p>' + sanitize(data.message).replaceAll('\n', '<br>') + '</p>';
        html += '<footer class="blockquote-footer">' + sanitize(data.username) + ' in <span class="roomname">' + sanitize(data.room) + ' on </span> <cite title="Source Title">(' + date + ')</cite></footer>';
        html += '</blockquote></div></div></div>';
        let isScrolledDown = document.querySelector('.messages')?.scrollHeight < 80 + document.querySelector('.messages')?.scrollTop + document.querySelector('.messages')?.clientHeight;
        document.querySelector('.messages').innerHTML += html;
        if (isScrolledDown) {
            // Scolled to the bottom
            document.querySelector('.messages')?.scrollTo(0, document.querySelector('.messages')?.scrollHeight);
        }
    });
    document.querySelector('#join-room')?.addEventListener('keyup', (ev) => {
        let input = document.getElementById('join-room');
        currentRoom = input.value.trim();
        if (ev.code == "Enter") {
            socket.emit('join-room', {
                room: sanitize(currentRoom)
            });
            input.value = "";
        }
    });
    document.querySelector('#new-message')?.addEventListener('keyup', (ev) => {
        let input = document.getElementById('new-message');
        if (ev.code == "Enter" && !ev.shiftKey) {
            socket.emit('message', {
                message: input.value,
                room: currentRoom
            });
            input.value = "";
        }
    });
    document.querySelector('#send-button')?.addEventListener('click', (ev) => {
        let input = document.getElementById('new-message');
        socket.emit('message', {
            message: input.value,
            room: currentRoom
        });
        input.value = "";
    });
    document.addEventListener('click', (ev) => {
        let input = ev.target.closest(".room");
        if (input) {
            currentRoom = input.textContent;
            socket.emit('room-list');
        }
    });
}
document.querySelector('#username')?.addEventListener('keyup', (ev) => {
    let input = document.getElementById('username');
    if (ev.code == "Enter") {
        startApp(input.value);
    }
});
