var WebSocketServer = require('ws').Server;
var Deal = require('./Deal.js');
var server = new WebSocketServer({
	port: 1111,
});

// 记忆卡片信息
var CardMsg =require('./Data/CardMsg.js');
var cardMsg = new CardMsg();

// html显示使用数据
var app = require('express')();
var server1 = require('http').Server(app);
var io = require('socket.io')(server1);
var Search = require('./Data/Search.js');
var search = new Search();
var style = require('./Data/style.json');
app.get('/index.css',function(req, res) {
	res.sendfile('./WWW/index.css');
});
app.get('/d3.js',function(req, res) {
	res.sendfile('./WWW/d3.js');
});
app.get('/jquery.js',function(req, res) {
	res.sendfile('./WWW/jquery.js');
});

app.get('/chsvg',function(req, res) {
	res.sendfile('./WWW/svg/chsvg.html');
});
app.get('/chsvg.js',function(req, res) {
	res.sendfile('./WWW/svg/chsvg.js');
});
app.get('/hzsvg',function(req, res) {
	res.sendfile('./WWW/svg/hzsvg.html');
});
app.get('/hzsvg.js',function(req, res) {
	res.sendfile('./WWW/svg/hzsvg.js');
});
server1.listen(8811, function() {
	console.log('http服务器开启');
});

// http连接
io.on('connection', function(socket) {
	socket.join('room');
	console.log(socket.id + '加入服务器');

	socket.on('disconnect', function() {
		// socket.emit('error', '与服务器断开连接');
		socket.leave('room');
		console.log(socket.id + '离开服务器');
	});
	socket.emit('style', style);

	socket.on('SearchHz', function(data) {
		var _json = search.searchWord(data);
		socket.emit('SearchHz', _json);
	});
	socket.on('SearchCh', function(data) {
		var _json = search.searchCh(data);
		socket.emit('SearchCh', _json);
	});

	socket.on('ChangeAdd', function(data) {
		var _json = search.changeAdd(data);
		socket.emit('SearchHz', _json);
	});
});

// websocket连接
// 处理客户端端发送的请求
var work = new Deal();
server.on('connection', function(socket) {
	console.log('新客户');

	socket.on('message', function(data) {
		var json = JSON.parse(data);
		console.log('得到客户端信息');

		if (json.from == 'GetCardMsg') {
			// 得到卡片学习信息
			var _json = cardMsg.foundCardMsg(json);
			socket.send(JSON.stringify(_json));
		} else if (json.from == 'GetPrint') {
			// 得到描红信息
			var path = './Characters/'+json.data.name+'.json';
			var _json = require(path);
			socket.send(JSON.stringify(_json));
		} else if (json.from == 'GetLesson') {
			// 得到课程信息
			var path = './Lessons/'+json.data.name+'.json';
			var _json = require(path);
			socket.send(JSON.stringify(_json));
		} else {
			// 得到用户信息
			work.getMsg(json, function(_json) {
				socket.send(JSON.stringify(_json));
			})
		}
	});

	socket.on('close', function() {
		console.log('客户离开');
	});
});

console.log("socket服务器开启！");