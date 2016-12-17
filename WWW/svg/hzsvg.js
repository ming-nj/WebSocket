var socket = io();
var search_word = '';

// WebViewBridge.onMessage = function (message) {
//   var json = JSON.parse(message);
//   if (json.kind == 'search') {
//     search(json.word);
//   }
// };

var parent=null, children=null;
socket.on('SearchHz', function(json) {
	if (json.type == "success") {
		parent = json.parent;
		children = json.children;

    $('svg').remove();
    createSvg();
		DealData();
    Log('HelloWorld from html5');
	}
});

var width = window.innerWidth,
    height = window.innerHeight;

var screen_zoom;
function createSvg() {
  // 创建svg
  var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);
  var back = svg.append("g")
      .attr("class", "back")
  var zoom = d3.zoom()
      .scaleExtent([1 / 4, 12])
      .on("zoom", zoomed);
  screen_zoom = d3.zoomIdentity;
  function zoomed() {
    back.attr("transform", function(d) {
      screen_zoom = d3.event.transform;
      return d3.event.transform;
    });
  }
  svg.call(zoom);

  var link = back.append("g")
      .attr("class", "links");
  var node = back.append("g")
      .attr("class", "nodes");
  var plink = back.append("g")
      .attr("class", "plinks");
  var pnode = back.append("g")
      .attr("class", "pnodes");
}

search('禾');
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
    return a.data.type - b.data.type;
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
    var point = project(node.x, node.y);
    node.dx = nodes[0].x + point[0];
    node.dy = nodes[0].y + point[1];
  });

  var scale = 1;
  var _n = maxDepth;
  if (_n > 2) _n = 2;
  var w = _n*radius*2 + nodeW*4;
  if (width > height) {
    if (w < height/2) w = height/2;
    scale = height/w;
  } else {
    if (w < width/2) w = width/2;
    scale = width/w;
  }

  var centerR = 0;
  nodes.forEach(function(node) {
    if (node.depth == 0) {
      var dr = radius/2;
      if (dr < nodeR + 10) dr = nodeR+10;
      // if (dr > 80) dr = 80;
      centerR = dr;
      node.r = dr;
    } else if (node.data.kind == 'yx') {
      node.r = 0;
    } else {
      node.r = nodeR;
    }
  });

  link = d3.selectAll("g").filter(".links")
    .selectAll("line")
      .data(root.descendants().slice(1))
      .enter().append("path")
        .attr("d", function(d) {
          if (d.depth == 1) {
            return "M" + project(d.x, d.y)
                  + "L" + project(d.parent.x, d.parent.y);
          } else {
            return "M" + project(d.x, d.y)
                  + "C" + project(d.x, (d.y + d.parent.y)/2)
                  + " " + project(d.parent.x, (d.y + d.parent.y)/2)
                  + " " + project(d.parent.x, d.parent.y);
          }
        })
        .attr("stroke", function(d) {
          return getColor(d.data.type, 1);
        })
        .attr("fill", "none")
        .attr("stroke-width", 1);
  node = d3.selectAll('g').filter('.nodes')
    .selectAll('g')
    .data(nodes)
    .enter().append('g')
      .attr('class', 'word')
      .attr('transform', function(node) {
        var t = d3.zoomIdentity.translate(node.dx, node.dy).scale(1);
        return t;
      })
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));
  node.append('circle')
    .attr('r',function(d) { return d.r; })
    .attr('fill', function(d) { return getColor(d.data.type, 0); })
    .attr('stroke', '#18281A')
    .attr('stroke-width', 1);
  node.append('text')
    .attr("text-anchor", "middle")
    .attr("dy", ".3em")
    .attr("font-size", function(d) { return d.r - 3;})
    .attr("fill", "black")
    .text(function(d) {
      if (d.depth == 0) {
        if (parent.length > 2) {
        } else {
          return d.data.word;
        }
      } else {
        return d.data.word;
      }
    });
  node = d3.selectAll("g").filter(".nodes");

  if (parent.length > 2) {
    var _w = centerR;
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
  if (p_nodes) {
    p_nodes.forEach(function(node) {
      if (node.depth == 0) {
        node.r = centerR/3;
      } else {
        node.r = centerR/4;
      }
    });
    plink = d3.selectAll("g").filter(".plinks")
    .selectAll("line")
      .data(p_nodes.slice(1))
      .enter().append("path")
        .attr("d", function(d) {
          return "M" + d.x + "," + d.y
                + "C" + d.x + "," + (d.y+centerR-20)
                + " " + d.parent.x + "," + (d.parent.y-centerR+20)
                + " " + d.parent.x + "," + d.parent.y;
        })
        .attr("stroke", "#577C3B")
        .attr("fill", "none")
        .attr("stroke-width", 1);
    pnode = d3.selectAll('g').filter('.pnodes')
      .selectAll('g')
      .data(p_nodes)
      .enter().append('g')
        .attr('class', 'pword')
        .attr('transform', function(node) {
          var t = d3.zoomIdentity.translate(node.x, node.y).scale(1);
          return t;
        })
        .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended));
    pnode.append('circle')
      .attr('r', function(d) {
        if (d.depth == 0) {
          return centerR/3;
        } else {
          return centerR/4;
        }
      })
      .attr('fill', function(d) {
        if (d.depth == 0) {
          return '#EAE99D';
        } else {
          return '#DCD9F1';
        }
      })
      .attr('stroke', '#18281A')
      .attr('stroke-width', 1);
    pnode.append('text')
      .attr("text-anchor", "middle")
      .attr('dy', '.3em')
      .attr('font-size', function(d) {return d.r-3;})
      .attr('fill', 'black')
      .text(function(d) {return d.data.word;});

    pnode = d3.selectAll("g").filter(".pnodes");
  }


  // 偏移到中心位置， 整体缩小
  var t = d3.zoomIdentity.translate(width/2, height/2).scale(scale);
  moveSreen(t);

  bln = false;
  var time = d3.timer(function() {
    bln = true;
    // $('#log').text(bln);
    time.stop();
  }, 500);
}

var transform;
function moveSreen(t) {
  transform = t;
  node.attr("transform", t);
  link.attr("transform", t);
  if (p_nodes) {
    pnode.attr("transform", t);
    plink.attr("transform", t);
  }
}

function project(x, y) {
  var _w = project_w/2;
  var angle = x / _w * Math.PI,
      p_r = (y/nodeH)*radius;
  return [p_r * Math.cos(angle), p_r * Math.sin(angle)];
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

var bln = true;
function dragstarted(d) {
}
function dragged(d) {
}
function dragended(d) {
  if (search_word == d.data.word) return;
  if (bln) {
    var json = {
      kind: 'SearchHz',
      old: search_word,
      data: d.data,
    };
    // WebViewBridge.send(JSON.stringify(json));
    var text = d.data.word;
    search(text);
  }
}

function Log(str) {
  var json = {
    kind: 'log',
    str: str
  };
  // WebViewBridge.send(JSON.stringify(json));
}