var socket = io();
var search_word = '';

var parent=null, children=null, Add=null;
socket.on('SearchHz', function(json) {
  if (Add) {
    for (var i=0;i<Add.List.length;i++) {
      $("#hello").remove();
    }
  }
	if (json.type == "success") {
		parent = json.parent;
		children = json.children;
    Add = json.Add;

    Add.List.forEach(function(name) {
      var add_n = Add[name].num;
      if (add_n != 0) {
        for (var i=0;i<add_n;i++) {
          var _name = name + ".A" + i;
          var _index = 1;
          if (i >= add_n/2) _index = 3;
          var cnode = {id: _name, word: '', type: 'Add', index: _index};
          children.push(cnode);
        }
      }
    });
    AddList();

    transform.x = 0;
    transform.y = 0;
    transform.k = 1;
		DealData();
	}
});

var blnShowAdd = false;
var SelectWord = '';
function AddList() {
  for (var i=0;i<Add.List.length;i++) {
    var _name = Add.List[i];
    var $div = $("<div id='hello'></div>");
    $div.addClass('AddPoint');

    var $p = $("<p></p>");
    $p.click(function() {
      SelectWord = $(this).text();
      render();
    });
    $p.text(Add[_name].word);
    $p.addClass('AddText');
    $div.append($p);

    var $input = $("<input />");
    $input.attr('id', 'input'+i);
    $input.val(Add[_name].num);
    $input.addClass('AddInput');
    $div.append($input);

    $('#AddMsg').append($div);
  }
}

var nodeDepth = 0;
var width = window.innerWidth,
    height = window.innerHeight;

var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    document.body.appendChild(canvas);
var ctx = canvas.getContext("2d");
var transform = d3.zoomIdentity;

d3.select(canvas)
  .call(d3.drag()
    .container(canvas)
    .subject(dragsubject)
      .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
  .call(
      d3.zoom()
        .scaleExtent([1/20, 3])
        .on("zoom", zoomed));
function zoomed() {
  transform = d3.event.transform;
  render();
}

var dragNode;
function dragsubject() {
	dragNode = null;
  var x = transform.invertX(d3.event.x),
      y = transform.invertY(d3.event.y);
  if (nodes) {
  	for (var i=0;i<nodes.length;i++) {
  		var node = nodes[i];
  		var dx = x - node.dx,
	        dy = y - node.dy,
	        r = nodeR + 2;
	    if (dx*dx + dy*dy < r*r) {
	      dragNode = node;
	      return node;
	    }
  	}
  }
  if (p_nodes) {
  	for (var i=0;i<p_nodes.length;i++) {
  		var node = p_nodes[i];
  		var dx = x - node.x,
  				dy = y - node.y,
  				r = nodeR + 2;
  		if (dx*dx + dy*dy < r*r) {
  			dragNode = node;
  			return node;
  		}
  	}
  }
  return null;
}
function dragstarted() {
  var text = dragNode.data.word;
	search(text);
}

function dragged() {
}

function dragended() {
}
search('用');
function search(_word) {
  if (_word != search_word) {
    search_word = _word;
    socket.emit('SearchHz', _word);
  }
}
var tree = d3.tree(),
    tree1 = d3.tree(),
    nodeR = 20,
    nodeW = (nodeR+4)*2, 
    nodeH = 200,
    radius = 0,
    maxDepth = 0,
    nodes, p_nodes;
// 对得到的数据进行处理
var stratify = d3.stratify()
    .parentId(function(d) { return d.id.substring(0, d.id.lastIndexOf(".")); });
function DealData() {
  nodes = null;
  p_nodes = null;

  var root = stratify(children);
  root.sort(function(a, b) {
    var _dis = a.data.index - b.data.index;
    if (_dis == 0) {
      _dis = a.data.type - b.data.type;
    }
    return _dis;
  });

  tree.nodeSize([nodeW, nodeH]);
  tree(root);
  nodes = root.descendants();

  var min=0, max=0;
  maxDepth=0;
  nodes.forEach(function(node) {
    if (node.x < min) min = node.x;
    if (node.x > max) max = node.x;
    if (node.depth > maxDepth) maxDepth = node.depth;
  })

  project_w = max - min + nodeW;
  if (project_w == 0) {
    project_w = nodeH;
  }
  radius = (project_w/2)/Math.PI;
  if (radius < nodeH) radius = nodeH;
  nodes.forEach(function(node) {
    nodeDepth = node.depth;
    var point = project(node.x, node.y);
    node.dx = nodes[0].x + point[0];
    node.dy = nodes[0].y + point[1];
  });
  transform.x = width/2;
  transform.y = height/2;
  var w = maxDepth*radius*2 + nodeW*4;
  if (width > height) {
    if (w < height/2) w = height/2;
    transform.k = height/w;
  } else {
    if (w < width/2) w = width/2;
    transform.k = width/w;
  }

  if (parent.length > 2) {
    var _w = radius/2;
    if (_w < nodeR+20) _w = nodeR+20;
    tree1.nodeSize([_w*2/3, _w]);

    var root1 = stratify(parent);
    tree1(root1);
    p_nodes = root1.descendants();
    var mx = nodes[0].x - p_nodes[0].x;
    var my = nodes[0].y+_w/2 - p_nodes[0].y;
    p_nodes.forEach(function(node) {
      node.x += mx;
      node.y = 0 - node.y + my;
      node.r = _w/3;
    });
  }
  render();
}

function project(x, y) {
  var _w = project_w/2;
  var _depth = y/nodeH;
  var _y = nodeH + (_depth-1)*(nodeH/2);
  var _x = x*_y/y;
  var angle = _x / _w * Math.PI,
      p_r = (_y/nodeH)*radius;
  // var angle = x / _w * Math.PI,
  //     p_r = (y/nodeH)*radius;
  return [p_r * Math.cos(angle), p_r * Math.sin(angle)];
}

// 显示
function render() {
	ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.translate(transform.x, transform.y);
  ctx.scale(transform.k, transform.k);

  // ctx.strokeStyle = '#BBBBBB';
  // for (var i=0;i<maxDepth;i++) {
  //   ctx.beginPath();
  //   ctx.arc(0, 0, radius*(i+1), 0, Math.PI * 2, true);
  //   ctx.stroke();
  // }

  if (nodes) {
  	nodes.forEach(function(d) {
      if (d.data.type == 'Add' && blnShowAdd==false) {
      } else {
        if (d.parent != null) {
          renderLine(d, d.parent);
        }
      }
    });
	  nodes.forEach(function(node) {
	  	defaultType();
	  	var dr = nodeR;
	  	if(node.depth == 0) {
	  		// 中心节点显示
		    dr = radius/2;
		    if (dr < nodeR + 10) dr = nodeR+10;
        var text = node.data.word;
		    if (p_nodes) {
          renderNode(node.dx, node.dy, dr, '');
          ctx.lineWidth=1;
		    	p_nodes.forEach(function(d) {
				    if (d.parent != null) {
				      var _point = {
				        x: d.x,
				        y: d.y
				      };
				      var _parent = {
				        x: d.parent.x,
				        y: d.parent.y
				      };
				      drawLineK(_parent, _point, 1, dr-dr/4);
				    }
				  });
		    	p_nodes.forEach(function(node) {
		    		defaultType();
					  ctx.lineWidth=2;
					  var _dr = dr/3;
					  if (node.depth == 0) {
					  	ctx.fillStyle = '#EAE99D';
					  } else {
			    		ctx.fillStyle = '#DCD9F1';
						  _dr = dr/4;
						}
						ctx.strokeStyle = '#577C3B';
						fontColor = "#AB7975";
						ctx.font = "" + _dr + "px Courier New";
            var text = node.data.word;
					  renderNode(node.x, node.y, _dr, text);
		    	});
		    } else {
          fontColor = "#AB7975";
          ctx.font = "" + dr/2 + "px Courier New";
          renderNode(node.dx, node.dy, dr, text);
        }
		  } else {
		  	// 其他节点
        if (node.data.type == 'Add' && blnShowAdd==false) {
        } else {
          var text = node.data.word;
          ctx.fillStyle = getColor(node.data.type, 0);
          if (node.data.type == 'Add') {
            ctx.fillStyle = '#785D5E';
          }
          fontColor = "blue";
          if (SelectWord == node.data.word) {
            ctx.fillStyle = '#E71D31';
            fontColor = '#F6F9F5';
          }
  			  renderNode(node.dx, node.dy, dr, text);
        }
			}
	  });
	}

  ctx.restore();
}
function getColor(type, kind) {
  if (kind == 0) {
    if (type == 1) {
      return '#D1E575';
    } else if (type == 2) {
      return '#7FE570';
    } else if (type == 3) {
      return '#E5ADB2';
    } else {
      return '#B1E5E0';
    }
  } else {
    if (type == 1) {
      return '#8D9D52';
    } else if (type == 2) {
      return '#53974A';
    } else if (type == 3) {
      return '#A07C83';
    } else {
      return '#7BA3A0';
    }
  }
}
var fontColor = "blue";
function defaultType() {
	ctx.lineWidth=4;
  ctx.strokeStyle = '#577C3B';
  ctx.fillStyle = '#B1E5E0';
  fontColor = "blue";
  ctx.textBaseline = 'middle';//设置文本的垂直对齐方式
  ctx.textAlign = 'center'; //设置文本的水平对对齐方式
  ctx.font = "" + nodeR + "px Courier New";
}
function renderNode(dx, dy, dr, text) {
  ctx.beginPath();
  ctx.arc(dx, dy, dr, 0, Math.PI * 2, true);
  ctx.stroke();
  ctx.fill();

  ctx.fillStyle = fontColor;
  ctx.fillText(text, dx, dy+2);

  ctx.closePath();
}

function renderLine(node, parent) {
  var ax = nodes[0].x;
  var ay = nodes[0].y;
  ctx.beginPath();

  var start = project(node.x, node.y),
  			sp = project(node.x, (node.y + parent.y)/2),
        ep = project(parent.x, (node.y + parent.y)/2),
        end = project(parent.x, parent.y);

  ctx.strokeStyle = getColor(node.data.type, 1);
  if (node.depth == 1) {
    // ctx.strokeStyle = '#923019';
    ctx.moveTo(start[0]+ax, start[1]+ay);
    ctx.lineTo(end[0]+ax, end[1]+ay);
  } else {
    // ctx.strokeStyle = '#1F6E7D';
    ctx.moveTo(start[0]+ax, start[1]+ay);
    ctx.bezierCurveTo(sp[0]+ax, sp[1]+ay, ep[0]+ax, ep[1]+ay, end[0]+ax, end[1]+ay);
  }

  ctx.stroke();
}
function drawLineK(start, end, kind, num) {
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  var ax1 = 0, ay1 = 0, ax2 = 0, ay2 = 0;
  if (kind == 0) {
    ay1 += num;
    ay2 -= num;
  } else if (kind == 1) {
    ay1 -= num;
    ay2 += num;
  } else if (kind == 2) {
    ax1 += num;
    ax2 -= num;
  } else if (kind == 3) {
    ax1 -= num;
    ax2 += num;
  }
  ctx.bezierCurveTo(start.x+ax1 , start.y+ay1 , end.x+ax2 , end.y+ay2 , end.x, end.y);
  ctx.stroke();
}