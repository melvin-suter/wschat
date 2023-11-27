"use strict";
var _a;
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
    var _a, _b, _c, _d;
    (_a = document.querySelector('.login')) === null || _a === void 0 ? void 0 : _a.classList.add("d-none");
    (_b = document.querySelector('.app')) === null || _b === void 0 ? void 0 : _b.classList.remove("d-none");
    const socket = io('ws://', {
        query: {
            username: username
        }
    });
    setUsername = username;
    socket.on('room-list', (data) => {
        var _a;
        (_a = document.querySelector('.rooms')) === null || _a === void 0 ? void 0 : _a.innerHTML = "";
        data.rooms.forEach((item) => {
            var _a;
            let html = '<div class="room d-flex justify-content-center align-items-center border-bottom p-4 ' + (sanitize(item) == currentRoom ? 'bg-success-subtle' : '') + '">';
            html += '<div class="title">' + sanitize(item) + '</div>';
            html += '</div>';
            (_a = document.querySelector('.rooms')) === null || _a === void 0 ? void 0 : _a.innerHTML += html;
        });
    });
    socket.on('message', (data) => {
        var _a, _b, _c, _d, _e, _f;
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
        let isScrolledDown = ((_a = document.querySelector('.messages')) === null || _a === void 0 ? void 0 : _a.scrollHeight) < 80 + ((_b = document.querySelector('.messages')) === null || _b === void 0 ? void 0 : _b.scrollTop) + ((_c = document.querySelector('.messages')) === null || _c === void 0 ? void 0 : _c.clientHeight);
        (_d = document.querySelector('.messages')) === null || _d === void 0 ? void 0 : _d.innerHTML += html;
        if (isScrolledDown) {
            // Scolled to the bottom
            (_e = document.querySelector('.messages')) === null || _e === void 0 ? void 0 : _e.scrollTo(0, (_f = document.querySelector('.messages')) === null || _f === void 0 ? void 0 : _f.scrollHeight);
        }
    });
    (_c = document.querySelector('#join-room')) === null || _c === void 0 ? void 0 : _c.addEventListener('keyup', (ev) => {
        let input = document.getElementById('join-room');
        currentRoom = input.value.trim();
        if (ev.code == "Enter") {
            socket.emit('join-room', {
                room: sanitize(currentRoom)
            });
            input.value = "";
        }
    });
    (_d = document.querySelector('#new-message')) === null || _d === void 0 ? void 0 : _d.addEventListener('keyup', (ev) => {
        let input = document.getElementById('new-message');
        if (ev.code == "Enter" && !ev.shiftKey) {
            socket.emit('message', {
                message: input.value,
                room: currentRoom
            });
            input.value = "";
        }
    });
    document.addEventListener('click', (ev) => {
        let input = ev.target.closest(".room");
        console.log(input);
        if (input) {
            currentRoom = input.textContent;
            socket.emit('room-list');
        }
    });
}
(_a = document.querySelector('#username')) === null || _a === void 0 ? void 0 : _a.addEventListener('keyup', (ev) => {
    let input = document.getElementById('username');
    if (ev.code == "Enter") {
        startApp(input.value);
    }
});
