function CardMsg() {
	var Read = require('./Read.js');
	var read = new Read();
	// 得到卡片信息
	this.foundCardMsg = function(json) {
		if (json.msg == 'Character') {
			return this.foundCardByGjKey(json.data)
		} else if (json.msg == 'Word') {
			return this.foundCardByChKey(json.data)
		} else if (json.msg == 'All') {
			var _json = {
				from: "GetCardMsg",
				msg: 'All',
				data: "失败"
			};
			var json_c = this.foundCardByGjKey(json.data.ziList);
			var json_w = this.foundCardByChKey(json.data.ciList);
			if (json_c.data!='失败' && json_w.data!='失败') {
				var msg = {
					'Character': json_c.data,
					'Word': json_w.data,
				};
				_json.data = msg;
			}
			return _json;
		}
	}
	// 
	this.foundCardByGjKey = function(data) {
		var json = {
			from: "GetCardMsg",
			msg: 'Character',
			data: "失败"
		};

		var list = [];
		data.forEach(function(_gjKey) {
			var gjData = read.getGjData(_gjKey);
			var _zxKey = gjData['字形key'];
			var zxData = read.getZxData(_zxKey);
			var _pyKey = gjData['拼音key'];
			var pyData = read.getPyData(_pyKey);
			var hzyxList = read.gethzYxKey(_gjKey);
			var yx_c = '';
			var yx_e = '';
			if (hzyxList != null) {
				var yxData = read.gethzYxData(hzyxList[0]);
				yx_c = yxData["义项中文"];
				yx_e = yxData['义项翻译'];
			}
			var _pc = '';
			if (pyData) {
				if (pyData["声母"]!="无声母") {
					_pc += pyData["声母"];
				}
				_pc += pyData["韵母"];
				_pc += pyData["声调"];
			}
			var _msg = {
				key: _gjKey,
				zx: zxData?zxData["字形内容"]:'没有字形信息',
				show: zxData?zxData['描红数据信息']:'没有字形信息',
				py: pyData?pyData['拼音内容']:'没有拼音信息',
				pc: _pc,
				play: pyData['音频数据信息'],
				yx_c: yx_c,
				yx_e: yx_e,
			};
			list.push(_msg);
		});
		json.data = list;

		return json;
	}
	this.foundCardByChKey = function(data) {
		var json = {
			from: "GetCardMsg",
			msg: 'Word',
			data: "失败"
		};

		var list = [];
		data.forEach(function(_chKey) {
			var chData = read.getChData(_chKey);
			var yx_c = '';
			var yx_e = '';
			var chyxList = read.getChYxKey(_chKey);
			if (chyxList != null) {
				var yxData = read.getchYxData(chyxList[0]);
				yx_c = yxData["义项中文"];
				yx_e = yxData['义项英文内容'];
			}
			var _msg = {
				key: _chKey,
				zx: chData?chData["词汇内容"]:'没有词汇信息',
				py: chData?chData['拼音内容']:'没有词汇信息',
				yx_c: yx_c,
				yx_e: yx_e,
			};
			list.push(_msg);
		});
		json.data = list;

		return json;
	}
}
module.exports = CardMsg;