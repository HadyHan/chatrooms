var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {}; 

/*处理程序场景及事件*/
//分配用户昵称
function assignGuestName(socket, guestNumber, nickNames, namesUsed) }{
	var name = 'Guest' + guestNumber;
	//把用户昵称跟客户端连接ID关联上
	nickNames[socket.id] = name;
	socket.emit('nameResult', {  //让用户知道他们的昵称
	        success: true,
	        name: name
	});
	namesUsed.push(name);  
   	return guestNumber + 1;
}

//与进入聊天室相关的逻辑
function joinRoom(socket, room){
	socket.join(room);  //让用户进入房间
    	currentRoom[socket.id] = room;  //记录用户的当前房间
    	socket.emit('joinResult', {room: room});
    	socket.broadcast.to(room).emit('message', {
	 	text: nickNames[socket.id] + ' has joined ' + room + '.'
   	 });
   	var usersInRoom = io.sockets.clients(room);
   	if (usersInRoom.length > 1){
   	 	var usersInRoomSummary = 'Users currently in ' + room + ': ';
   	 	for (var index in usersInRoom) {
		            var userSocketId = usersInRoom[index].id;
		            if (userSocketId != socket.id) {
		                 if (index > 0) {
		                     usersInRoomSummary += ', ';
		                }
		                     usersInRoomSummary += nickNames[userSocketId];
		            }
		}
		usersInRoomSummary += '.';
      		socket.emit('message', {text: usersInRoomSummary});
   	 }
}

//更名请求的处理逻辑
function handleNameChangeAttempts(socket, nickNames, namesUsed){
	socket.on('nameAttempt', function(name){
		if (name.indexOf('Guest') == 0){
			socket.emit('nameResult', {
			        success: false,
			        message: 'Names cannot begin with "Guest".'
			}); 
		}else{
			if (namesUsed.indexOf(name) == -1){
				var previousName = nickNames[socket.id];
				var previousNameIndex = namesUsed.indexOf(previousName); 
				namesUsed.push(name);
				nickNames[socket.id] = name;
				delete namesUsed[previousNameIndex];
				socket.emit('nameResult', {
				            success: true,
				            name: name
				});
				socket.broadcast.to(currentRoom[socket.id]).emit('message', {
            					text: previousName + ' is now known as ' + name + '.'
				});
			}else{
				socket.emit('nameResult',{
					success: false,
               					message: 'That name is already in use.'
				});
			}
		}
	});
}

//
function handleMessageBroadcasting(socket){
	socket.on('message', function (message) {
		socket.broadcast.to(message.room).emit('message', {
			text: nickNames[socket.id] + ': ' + message.text
		});
	})
}

//
function handleRoomJoining(socket) {
     socket.on('join', function(room) {
         socket.leave(currentRoom[socket.id]);
         joinRoom(socket, room.newRoom);
     });
} 

//
function handleClientDisconnection(socket) {
    socket.on('disconnect', function() {
        var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    }); 
} 

//设置Socket.IO服务器
exports.listen = function(server) {
	io = socketio.listen(server); 
	io.set('log level', 1);
    	io.sockets.on('connection', function (socket){
    		guestNumber = assignGuestName(socket, guestNumber,nickNames, namesUsed); 
    		joinRoom(socket, 'Lobby'); 
    		handleNameChangeAttempts(socket, nickNames, namesUsed);
    		handleRoomJoining(socket);
    		socket.on('rooms', function() {
    			socket.emit('rooms', io.sockets.manager.rooms);
    		}
    		handleClientDisconnection(socket, nickNames, namesUsed);
    	}
}