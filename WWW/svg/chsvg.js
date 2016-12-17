var socket = io();
var search_word = '';

// WebViewBridge.onMessage = function (message) {
//   var json = JSON.parse(message);
//   if (json.kind == 'search') {
//     search(json.word);
//   } else {
//     selectYx(json.key);
//   }
// };

var parent=null, children=null, yxstr=null;
socket.on('SearchCh', function(json) {
	if (json.type == "success") {
    bln = false;
		parent = json.parent;
		children = json.children;
    yxstr = json.yxstr;

    $('svg').remove();
    createSvg();
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
var screen_zoom;
function createSvg() {
  // 创建svg
  var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);
  var back = svg.append("g")
      .attr("class", "back")
  var zoom = d3.zoom()
      .scaleExtent([1 / 4, 3])
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
    var _yx = node.data.yx;
    if (_yx=='zundefined' || _yx=='cundefined' || _yx==undefined) {
      blnNull = true;
    } else {
      if (yxList.indexOf(_yx) < 0) {
        yxList.push(_yx);
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
    blnNull: blnNull,
  };
  // WebViewBridge.send(JSON.stringify(jsonMsg));

  // if (nodes.length > 1) {
  //   yxList.forEach(function(yxkey) {
  //     if (!blnNull && index == 0) {

  //     } else {
  //       var $div = $("<div id='hello'></div>");
  //       // $div.attr('id', 'hello');
  //       $div.addClass('yxShow');
  //       var $point = $("<div></div>");
  //       $point.addClass('yxPoint');
  //       $point.css("background-color", style.fillStyle[index])
  //       var $p = $("<p></p>");
  //       $p.addClass('yxText');
  //       if (index == 0) {
  //         $p.text('对不起，义项不明');
  //       } else {
  //         if (yxstr[yxkey]) {
  //           $p.text(yxstr[yxkey]);
  //         } else {
  //           $p.text(yxkey+" 没有义项中文");
  //         }
  //       }
  //       $div.append($point);
  //       $div.append($p);
  //       $('#yxMsg').append($div);
  //     }
  //     index += 1;
  //   });
  // }

  var centerR = 0;
  nodes.forEach(function(node) {
    if (node.depth == 0) {
      var dr = radius/2;
      if (dr < nodeR + 10) dr = nodeR+10;
      if (dr > 80) dr = 80;
      centerR = dr;
      node.r = dr;
    } else if (node.data.kind == 'yx') {
      node.r = 0;
    } else {
      node.r = nodeR;
    }
    var yx = node.data.yx;
    if (yx == 'zundefined' || yx=='cundefined') {
      node.data.yx = 'undefined';
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
          return style.strokeStyle[getYxIndex(d.data.yx)];
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
    .attr('fill', function(d) {
      if (d.depth == 0) {
        return "#B1E5E0";
      } else {
        return style.fillStyle[getYxIndex(d.data.yx)];
      }
    })
    .attr('stroke', '#18281A')
    .attr('stroke-width', 1);
  node.append('text')
    .attr("text-anchor", "middle")
    .attr("dy", ".3em")
    .attr("font-size", function(d) {return d.r-3 })
    .attr("fill", "black")
    .text(function(d) {
      if (d.depth == 0) {
        if (parent.length > 1) {
        } else {
          return d.data.word;
        }
      } else {
        if (d.data.kind != 'yx') {
          return d.data.word;
        } else {
          return '';
        }
      }
    });
  var w = (2*radius*2 + nodeW*4)/2;
  var scale = 1;
  if (width < height) {
    if (w < width/2) w = width/2;
    scale = width/w;
  } else {
    if (w < height/2) w = height/2;
    scale = height/w;
  }

  node = d3.selectAll("g").filter(".nodes");
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
                + "C" + d.x + "," + (d.y+70)
                + " " + d.parent.x + "," + (d.parent.y-70)
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
function selectYx(key) {
  if (key == 'c') return;
  var min_x=null, max_x=null, min_y=null, max_y=null;
  node.selectAll('circle')
    .attr('r', function(d) {
      if (d.data.yx == key && d.data.kind != 'yx') {
        if (min_x == null) min_x = d.dx;
        if (d.dx < min_x) min_x = d.dx;
        if (max_x == null) max_x = d.dx;
        if (d.dx > max_x) max_x = d.dx;
        if (min_y == null) min_y = d.dy;
        if (d.dy < min_y) min_y = d.dy;
        if (max_y == null) max_y = d.dy;
        if (d.dy > max_y) max_y = d.dy;
        return d.r + 2;
      } else return d.r;
    })
    .attr('stroke-width', function(d) {
      if (d.data.yx == key) {
        return 2;
      } else return 1;
    })
    .attr('stroke', function(d) {
      if (d.data.yx == key) return '#FF001C';
      else return '#18281A';
    });
  d3.selectAll("path")
    .attr("stroke-width", function(d) {
      if (d.data.yx == key) {
        return 2;
      } else {
        return 1;
      }
    })
    .attr("stroke", function(d) {
      if (d.data.yx == key) {
        return '#FF001C';
      } else {
        return style.strokeStyle[getYxIndex(d.data.yx)];
      }
    });
  if (min_x!=null && max_x!=null && min_y!=null && max_y!=null) {
    var _minx = screen_zoom.applyX(transform.applyX( min_x-nodeR ));
    var _maxx = screen_zoom.applyX(transform.applyX( max_x+nodeR ));
    var _miny = screen_zoom.applyY(transform.applyY( min_y-nodeR ));
    var _maxy = screen_zoom.applyY(transform.applyY( max_y+nodeR ));

    if (_minx > 0 && _maxx < width && _miny > 0 && _maxy < height) {
    } else {
      var m_x = (min_x+max_x)/2,
          m_y = (min_y+max_y)/2;
      var scale = transform.k;
      var dis_x = (width/2)/screen_zoom.k - m_x*transform.k - screen_zoom.x/screen_zoom.k,
          dis_y = (height/2)/screen_zoom.k - m_y*transform.k - screen_zoom.y/screen_zoom.k;
      Log('dis_x: '+dis_x+' dis_y: '+dis_y);
      var t = d3.zoomIdentity.translate(dis_x, dis_y).scale(scale);
      moveSreen(t);
    }
  }
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

var bln = true;
function dragstarted(d) {
}
function dragged(d) {
}
function dragended(d) {
  // $('#log').text(bln);
  if (bln) {
    if (d.data.kind != 'yx') {
      var text = d.data.word;
      search(text);
    }
  }
}
function Log(str) {
  var json = {
    kind: 'log',
    str: str
  };
  // WebViewBridge.send(JSON.stringify(json));
}