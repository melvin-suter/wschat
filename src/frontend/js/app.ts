var setUsername;
var currentRoom = "Global";

function sanitize(string:string) {
	const map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#x27;',
		"/": '&#x2F;',
	};
	const reg = /[&<>"'/]/ig;
	return string.replace(reg, (match:string)=>(map[match]));
}

function startApp(username:string) {
    document.querySelector('.login')?.classList.add("d-none");
    document.querySelector('.app')?.classList.remove("d-none");


    const socket = io('ws://',{
        query: {
            username: username
        }
    });
    setUsername = username;

    socket.on('room-list',(data:any) => {

        document.querySelector('.rooms')?.innerHTML  = "";
        
        data.rooms.forEach((item:any) => {
            let html = '<div class="room d-flex justify-content-center align-items-center border-bottom p-4 '+(sanitize(item) == currentRoom ? 'bg-success-subtle' : '' )+'">';
            html += '<div class="title">'+sanitize(item)+'</div>';
            html += '</div>';
            document.querySelector('.rooms')?.innerHTML += html;
        });

    

    });

    socket.on('message',(data:any) => {

        let date = (new Date()).toISOString().split("T")[0];

        let scopeColor = data.scope == 'user' ? 'bg-warning-subtle' : '';
        scopeColor = data.scope == 'room' ? 'bg-info-subtle' : scopeColor;
        scopeColor = data.scope == 'room' && data.room == "Global" ? 'bg-secondary-subtle' : scopeColor;
        

        let html = '<div class="card mb-3 '+scopeColor+'">';
        html += '<div class="card-body">';
        html += '<div class="card-text">';
        html += '<blockquote class="blockquote mb-0">';
        html += '<p>'+sanitize(data.message).replaceAll('\n','<br>')+'</p>';
        html += '<footer class="blockquote-footer">'+sanitize(data.username)+' in <span class="roomname">'+sanitize(data.room)+' on </span> <cite title="Source Title">('+ date + ')</cite></footer>';
        html += '</blockquote></div></div></div>';

        let isScrolledDown:boolean = document.querySelector('.messages')?.scrollHeight! < 80 + document.querySelector('.messages')?.scrollTop! + document.querySelector('.messages')?.clientHeight!;

        document.querySelector('.messages')?.innerHTML += html;


        if(isScrolledDown) {
            // Scolled to the bottom
            document.querySelector('.messages')?.scrollTo(0,document.querySelector('.messages')?.scrollHeight!);
        } 
    });



    document.querySelector('#join-room')?.addEventListener('keyup',(ev:any) => {
        let input:HTMLInputElement = document.getElementById('join-room') as HTMLInputElement;
       
        currentRoom = input.value.trim();

        if(ev.code == "Enter") {
            socket.emit('join-room',{
                room: sanitize(currentRoom);
            })


            input.value = "";
        }
    });



    document.querySelector('#new-message')?.addEventListener('keyup',(ev:any) => {
        let input:HTMLInputElement = document.getElementById('new-message') as HTMLInputElement;

        if(ev.code == "Enter" && !ev.shiftKey) {
            socket.emit('message',{
                message: input.value,
                room: currentRoom
            })

            input.value = "";
        }
    });



    document.addEventListener('click',(ev:any) => {
        let input = ev.target.closest(".room");
        console.log(input);
        if(input){
            currentRoom = input.textContent;
            socket.emit('room-list');
        }
    });
}

document.querySelector('#username')?.addEventListener('keyup',(ev:any) => {
    let input:HTMLInputElement = document.getElementById('username') as HTMLInputElement;

    if(ev.code == "Enter") {
        startApp( input.value);
    }
});
