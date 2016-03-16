(function(RTCat, $){

    //声明变量
    var session;
    var users;
    var localStream; // 将要创建的本地流
    var mediaList = document.querySelector('#media-list'); // 用于播放视频的元素

    //获取token,初始化session
    $.ajax({
        url:'http://localhost:8080/tokens/my-chatroom',
        method:'GET',
        success: function (resp) {
            var token = resp.uuid;
            initSession(token);
        }
    });

    // 发送消息
    $("#message-field").keypress(function (event) {
        if (event.which == 13) {
            event.preventDefault();
            $('#send').click();
        }
    });
    $('#send').click(function () {
        var message = $('#message-field').val();
        if (message) {
            sendMessage({
                message: message,
                sender: $('#username').val() || '佚名'
            })
        }
    });

    function initSession(token) {

        session = new RTCat.Session(token);

        session.connect();

        session.on('connected', function (users) {
            console.log('Session connected');
            initStream({video: true, audio: true, data: true, ratio: 1.33}, function (stream) {
                displayStream('self', stream)
            });
        });

        session.on('in', function (token) {
            console.log('Someone in ' + token);
            session.sendTo({to: token, stream: localStream, data: true});
        });

        session.on('out', function (token) {
            console.log('Someone out ' + token);
        });

        session.on('remote', function (r_channel) {
            var id = r_channel.getId();
            console.log('remote:'+id);
            r_channel.on('stream', function (stream) {
                displayStream(id, stream);
            });
            r_channel.on('close', function () {
                $('#peer-' + id).parent().remove();
            });
        });

        session.on('message', function (token, pkg) {
            console.log('Message received from ' + token);
            var pkg = JSON.parse(pkg);
            displayMessage(pkg.sender, pkg.message)
        });

    }

    //初始化本地流
    function initStream(options, callback) {
        localStream = new RTCat.Stream(options);
        localStream.on('access-accepted', function () {
                session.send({stream: localStream, data: true});
                callback(localStream);
            }
        );
        localStream.on('access-failed', function (err) {
            console.log(err);
        });
        localStream.on('play-error', function (err) {
            console.log(err);
        });
        localStream.init();
    }

    //显示流
    function displayStream(id, stream) {
        // Video container
        var videoContainer = document.createElement("div");
        videoContainer.setAttribute('class', "text-center");
        // Video player
        var videoPlayer = document.createElement('div');
        videoPlayer.setAttribute("id", "peer-" + id);
        videoPlayer.setAttribute("class", "video-player");
        videoContainer.appendChild(videoPlayer);
        mediaList.appendChild(videoContainer);

        stream.play("peer-" + id);
    }

    // 发送消息
    function sendMessage(pkg) {
        // display the sent message
        displayMessage("我", pkg.message);
        users = session.getWits();
        for (var user in users) {
            session.sendMessage(user, JSON.stringify(pkg));
        }
        // reset message field content
        $("#message-field").val("");
    }

    // 显示消息
    function displayMessage(user, message) {
        // create a message node and insert it in div#messages_container node
        var container = document.querySelector("#messages-container");
        var textNode = document.createTextNode(user + " > " + message);
        var node = document.createElement("div");
        node.className = "message";
        node.appendChild(textNode);
        container.appendChild(node);
        // scroll to bottom to always display the last message
        container.scrollTop = container.scrollHeight;
    }

}).apply(this, [window.RTCat, jQuery]);
