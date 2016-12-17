var socket = io();
var search_word = '';

// WebViewBridge.onMessage = function (message) {
//   search(message);
// };

var parent=null, children=null, yxstr=null;
socket.on('SearchCh', function(json) {
  if (json.type == "success") {
    parent = json.parent;
    children = json.children;
    yxstr = json.yxstr;

    transform.x = 0;
    transform.y = 0;
    transform.k = 1;
    DealData();
    $("#msg").text('');
  } else {
    $("#msg").text(json.data);
  }
});
var style;
socket.on('style', function(json) {
  style = json;
  var json = {
    kind: 'style',
    style: style
  };
  // WebViewBridge.send(JSON.stringify(json));
});

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
  $("#msg").text('');
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
  if (dragNode.data.kind != 'yx') {
    var text = dragNode.data.word;
    search(text);
  }
}

function dragged() {
}

function dragended() {
}

search('打');
function search(_word) {
  if (_word != search_word) {
    search_word = _word;
    socket.emit('SearchCh', _word);
  }
}

// 保存义项信息
var yxList = [];
var blnNull = false;
function setYxList() {
  blnNull = false;
  var index = 0;
  yxList.push("undefined");
  nodes.forEach(function(node) {
    if (index != 0) {
      var _yx = node.data.yx;
      if (_yx == 'zundefined' || _yx=='cundefined' || _yx=='undefined') {
        blnNull = true;
      } else {
        if (yxList.indexOf(_yx) < 0) {
          yxList.push(_yx);
        }
      }
    }
    index += 1;
  });
}
function getYxIndex(yx) {
  if (yx == 'zundefined' || yx=='cundefined') return 0;
  return yxList.indexOf(yx);
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
    return _dis;
  });

  tree.nodeSize([nodeW, nodeH]);
  tree(root);
  nodes = root.descendants();

  var min=0, max=0;
  maxDepth=0;
  var marker_depth = 1;
  nodes.forEach(function(node) {
    if (node.depth != 0) {
      var _x = node.x;
      if (_x < min) min = _x;
      if (_x > max) max = _x;
      if (node.depth > maxDepth) maxDepth = node.depth;
    }
  })
  function getx(_x, _depth) {
    return _x/_depth;
  }

  project_w = max - min + nodeW;
  if (project_w == 0) {
    project_w = nodeH;
  }
  radius = (project_w/2)/Math.PI;
  if (radius < nodeH) radius = nodeH;
  nodes.forEach(function(node) {
    var point = project(node.x, node.y);
    node.dx = nodes[0].x + point[0];
    node.dy = nodes[0].y + point[1];
  });
  transform.x = width/2;
  transform.y = height/2;
  var w = (2*radius*2 + nodeW*4)/2;
  if (width < height) {
    if (w < width/2) w = width/2;
    transform.k = width/w;
  } else {
    if (w < height/2) w = height/2;
    transform.k = height/w;
  }

  if (parent.length > 1) {
    if (parent[1].word != parent[0].word) {
      var _w = radius/2;
      if (_w < nodeR+20) _w = nodeR+20;
      if (_w > 80) _w = 80;
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
  }
  yxList.forEach(function(yxkey) {
    $('#hello').remove();
  });
  yxList = [];
  setYxList();
  var index = 0;
  var jsonMsg = {
    kind: 'yxmsg',
    yxList: yxList,
    yxstr: yxstr,
  };
  // WebViewBridge.send(JSON.stringify(jsonMsg));
  if (nodes.length > 1) {
    yxList.forEach(function(yxkey) {
      if (!blnNull && index == 0) {

      } else {
        var $div = $("<div id='hello'></div>");
        // $div.attr('id', 'hello');
        $div.addClass('yxShow');
        var $point = $("<div></div>");
        $point.addClass('yxPoint');
        $point.css("background-color", style.fillStyle[index])
        var $p = $("<p></p>");
        $p.addClass('yxText');
        if (index == 0) {
          $p.text('对不起，义项不明');
        } else {
          if (yxstr[yxkey]) {
            $p.text(yxstr[yxkey]);
          } else {
            $p.text(yxkey+" 没有义项中文");
          }
        }
        $div.append($point);
        $div.append($p);
        $('#yxMsg').append($div);
      }
      index += 1;
    });
  }
  render();
}
function project(x, y) {
  var _w = project_w/2;
  var angle = x / _w * Math.PI,
      p_r = (y/nodeH)*radius;
  if (nodes[0].data.kind == 'hz') {
    p_r = p_r/2;
  }
  return [p_r * Math.cos(angle), p_r * Math.sin(angle)];
}

function getColor(r, g, b) {
  var str = '#';
  str += r.toString(16);
  str += g.toString(16);
  str += b.toString(16);
  return str;
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
      if (d.parent != null) {
        renderLine(d, d.parent);
      }
    });
    nodes.forEach(function(node) {
      defaultStyle();
      var dr = nodeR;
      if(node.depth == 0) {
        // 中心节点显示
        dr = radius/2;
        if (dr < nodeR + 10) dr = nodeR+10;
        if (dr > 80) dr = 80;
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
            defaultStyle();
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
            fontSize = _dr;
            var text = node.data.word;
            renderNode(node.x, node.y, _dr, text);
          });
        } else {
          fontColor = "#AB7975";
          fontSize = dr/2;
          renderNode(node.dx, node.dy, dr, text);
        }
      } else {
        // 其他节点
        if (node.data.kind != 'yx') {
          var text = node.data.word;
          ctx.fillStyle = style.fillStyle[getYxIndex(node.data.yx)];
          renderNode(node.dx, node.dy, dr, text);

          // defaultStyle();
          // renderNode(node.x, node.y+1000, dr, text);
        }
      }
    });
  }

  ctx.restore();
}

var fontColor = "blue";
var fontSize;
function defaultStyle() {
  ctx.lineWidth=4;
  ctx.strokeStyle = '#577C3B';
  ctx.fillStyle = '#B1E5E0';
  fontColor = "blue";
  ctx.textBaseline = 'middle';//设置文本的垂直对齐方式
  ctx.textAlign = 'center'; //设置文本的水平对对齐方式
  fontSize = nodeR-3;
}
function renderNode(dx, dy, dr, text) {
  ctx.beginPath();
  ctx.arc(dx, dy, dr, 0, Math.PI * 2, true);
  ctx.stroke();
  ctx.fill();

  ctx.font = "" + fontSize + "px Courier New";
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

  var s = transform.k;
  s = 1;
  ctx.strokeStyle = style.strokeStyle[getYxIndex(node.data.yx)];
  if (node.depth == 1) {
    ctx.moveTo((start[0]+ax)*s, (start[1]+ay)*s);
    ctx.lineTo((end[0]+ax)*s, (end[1]+ay)*s);
  } else {
    ctx.moveTo((start[0]+ax)*s, (start[1]+ay)*s);
    ctx.bezierCurveTo((sp[0]+ax)*s, (sp[1]+ay)*s, (ep[0]+ax)*s, (ep[1]+ay)*s, (end[0]+ax)*s, (end[1]+ay)*s);
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
  var s = transform.k;
  s = 1;
  ctx.bezierCurveTo((start.x+ax1)*s , (start.y+ay1)*s , (end.x+ax2)*s , (end.y+ay2)*s , (end.x)*s, (end.y)*s);
  ctx.stroke();
}