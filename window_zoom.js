
var svg = d3.select("svg"),
margin = {top: 20, right: 20, bottom: 170, left: 60},
margin2 = {top: 430, right: 20, bottom: 30, left: 60},
width = +svg.attr("width") - margin.left - margin.right,
height = +svg.attr("height") - margin.top - margin.bottom,
height2 = +svg.attr("height") - margin2.top - margin2.bottom;

var x = d3.scaleLinear().range([0, width]),
x2 = d3.scaleLinear().range([0, width]),
y = d3.scaleLinear().range([height, 0]),
y2 = d3.scaleLinear().range([height2, 0]);

var xAxis = d3.axisBottom(x),
xAxis2 = d3.axisBottom(x2),
yAxis = d3.axisLeft(y);

var brush = d3.brushX()
.extent([[0, 0], [width, height2]])
.on("brush end", brushed);

var brush2 = d3.brushX()
		.extent([[0, 0], [width, height]])
		.on("brush end", brushed2);

var zoom = d3.zoom()
.scaleExtent([1, Infinity])
.translateExtent([[0, 0], [width, height2]])
.extent([[0, 0], [width, height2]])
.on("zoom", zoomed);

var line = d3.line()
		.x(function (d) { return x(d.time); })
		.y(function (d) { return y(d.amplitude); });

var line2 = d3.line()
		.x(function (d) { return x2(d.time); })
		.y(function (d) { return y2(d.amplitude); });

var clip = svg.append("defs").append("svg:clipPath")
		.attr("id", "clip")
		.append("svg:rect")
		.attr("width", width)
		.attr("height", height)
		.attr("x", 0)
		.attr("y", 0); 


var Line_chart = svg.append("g")
		.attr("class", "focus")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.attr("clip-path", "url(#clip)");


var focus = svg.append("g")
		.attr("class", "focus")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var context = svg.append("g")
.attr("class", "context")
.attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

d3.csv("A114_raw_512Hz.csv", function (error, data2) {
if (error) throw error;

// Parse out channel names
var channelNames = d3.keys(data2[0]);

// Get the EEG Data from the .csv file
var allData = getEEGData(channelNames, data2, 512);

var data = allData[0].value;


x.domain(d3.extent(data, function(d) { return d.time; }));
y.domain(d3.extent(data, function(d) { return d.amplitude; }));
x2.domain(x.domain());
y2.domain(y.domain());


focus.append("g")
		.attr("class", "axis axis--x")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);

focus.append("g")
		.attr("class", "axis axis--y")
		.call(yAxis);

focus.append("g")
		.attr("class", "brush2")
      .call(brush2)
      .call(brush2.move, x.range());

Line_chart.append("path")
		.datum(data)
		.attr("class", "line")
		.attr("d", line);

context.append("path")
		.datum(data)
		.attr("class", "line")
		.attr("d", line2);


context.append("g")
	.attr("class", "axis axis--x")
	.attr("transform", "translate(0," + height2 + ")")
	.call(xAxis2);

context.append("g")
	.attr("class", "brush")
	.call(brush)
	.call(brush.move, x.range());

svg.append("rect")
	.attr("class", "zoom")
	.attr("width", width)
	.attr("height", height2)
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
	.call(zoom);

});

//var i=0;
function brushed2(){
	//i++;
	//console.log(i);
}

function brushed() {
if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
var s = d3.event.selection || x2.range();
x.domain(s.map(x2.invert, x2));
Line_chart.select(".line").attr("d", line);
focus.select(".axis--x").call(xAxis);
svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
	.scale(width / (s[1] - s[0]))
	.translate(-s[0], 0));
}

function zoomed() {
if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
var t = d3.event.transform;
x.domain(t.rescaleX(x2).domain());
Line_chart.select(".line").attr("d", line);
focus.select(".axis--x").call(xAxis);
context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
}

function getChannelData(channel, data, freq)
{
let d = data.map(a => a[channel]).map(Number);
let result = [];
let t =0;
for(let i=0; i<d.length; i++)
{
result.push({
	amplitude: d[i],
	time: t
});
t+= 1/freq;
}
return result;
};

function getEEGData(channelNames, data, freq)
{
let d = [];
for(let i=0; i<channelNames.length; i++)
{
let channelData = getChannelData(channelNames[i], data, freq);
//console.log(channelNames[i]);
//console.log(channelData);
d.push({channel: channelNames[i],
				value: channelData,
});
}
return d;
};
