

/*
d3.csv("A114_raw_512Hz.csv", function (error, data2) {
if (error) throw error;

// Parse out channel names
var channelNames = d3.keys(data2[0]);

// Get the EEG Data from the .csv file
var allData = getEEGData(channelNames, data2, 512);

var data = allData[0].value;
draw(data);

});*/

function draw(d, freq){
  // Extract data and channel name
  let data = d.value;
  let channel = d.channel;

	d3.select("#title")
	.text(channel)
	.attr("transform",
	"translate(" + (width/2) + ", 0)");  

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

	// The brush for the focus (big chart)
	var brush = d3.brushX()
		.extent([[0, 0], [width, height]])
		.on("brush end", brushed);

	// The brush for the context (zooming)
	var brush2 = d3.brushX()
		.extent([[0, 0], [width, height2]])
		.on("brush end", brushedZoom);

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
			

	let min = x.domain()[0];
	let range = x.domain()[1]-x.domain()[0];
	let offset = range*.1;
	focus.append("g")
	.attr("class", "brush")
		.call(brush)
		.call(brush.move, [min,min+offset].map(x));

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
		.attr("class", "brush2")
		.call(brush2)
		.call(brush2.move, x.range());

	svg.append("rect")
		.attr("class", "zoom")
		.attr("width", width)
		.attr("height", height2)
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.call(zoom);

		// Event listeners to move the brush
		d3.select("#window_button").on("click", moveBrush);
		d3.selectAll("input").on("change", moveBrush);
		$("input").keyup(function(event){
			if(event.which === 13){
				moveBrush();
			}
		});

	function moveBrush(){
		var start = d3.select("#window_start").property("value");
		var end = d3.select("#window_end").property("value");
		//console.log(`start: ${start}  end: ${end}`);
		if(!isNumber(start) || !isNumber(end)){
			alert(`Error: ${!isNumber(start) ? "Starting input" : "Ending input"} is not a valid number.`);
		} else if(start > end){
			alert(`Error: Incorrect window range. Start time cannot be greater than end time.`);
		} else if (end < start){
			alert(`Error: Incorrect window range. End time cannot be less than start time.`);
		} else if(start < x.domain()[0] || end < x.domain()[0]){
			alert(`Error: Invalid input. ${start < x.domain()[0] ? start : end} is less than min domain ${x.domain()[0]}`);
		} else if (start > x.domain()[1] || end > x.domain()[1]){
			alert(`Error: Invalid input. ${start > x.domain()[0] ? start : end} is greater than max domain ${x.domain()[1]}`);
		} else {
			d3.select('.brush')
				.call(brush.move, [start ,end].map(x));
		}
		
	}

	function brushed(){
		// Get window area
    var extent = d3.event.selection;
		output(extent);
  };

	function output(extent){
		if(extent){
			// Get lower/upper bounds of the window (time)
			var time_range = extent.map(x.invert, x);
			
			// Parse out the time data from the original dataset
			let tData = data.map(a => a.time);
			let aData = data.map(a => a.amplitude);

			// Calulate the upper and lower indexes of original dataset
			var lower = findClosestIdx(time_range[0], tData);
			var upper = findClosestIdx(time_range[1], tData);

			// Slice out the original data based on the window selection
			var windowData = aData.slice(lower, upper+1);
			
			// Output the length/range of the window
			document.getElementById('window_len').innerText = `Window length: ${(time_range[1] - time_range[0]).toFixed(3)} seconds`;
			document.getElementById('window_range').innerText = `Window range: ${(time_range[0].toFixed(3))} sec to ${(time_range[1].toFixed(3))} sec`;

			// Update the time range input boxes (if brush is dragged)
			document.getElementById('window_start').value = time_range[0].toFixed(3);
			document.getElementById('window_end').value = time_range[1].toFixed(3);

			// TODO: Add code for calculation FFTs, Bandpower, Visualizations, etc using the windowData...
			let bandpower = bci.bandpower(windowData, freq, ['delta', 'theta', 'alpha', 'beta', 'gamma']);
			document.getElementById('delta_bp').innerText = `Delta Bandpower: ${bandpower[0].toFixed(3)}`;
			document.getElementById('theta_bp').innerText = `Theta Bandpower: ${bandpower[1].toFixed(3)}`;
			document.getElementById('alpha_bp').innerText = `Alpha Bandpower: ${bandpower[2].toFixed(3)}`;
			document.getElementById('beta_bp').innerText = `Beta Bandpower: ${bandpower[3].toFixed(3)}`;
			document.getElementById('gamma_bp').innerText = `Gamma Bandpower: ${bandpower[4].toFixed(3)}`;
		}
		else{
			alert("Please select a nonzero brush area");
		}
	}
	

	function brushedZoom() {
		if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
		var s = d3.event.selection || x2.range();
		x.domain(s.map(x2.invert, x2));
		Line_chart.select(".line").attr("d", line);
		focus.select(".axis--x").call(xAxis);
		svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
			.scale(width / (s[1] - s[0]))
			.translate(-s[0], 0));

			let min = x.domain()[0];
			let range = x.domain()[1]-x.domain()[0];
			let offset = range*.1;
			d3.select('.brush')
					.call(brush.move, [min,min+offset].map(x));
	}

	function zoomed() {
		if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
		var t = d3.event.transform;
		x.domain(t.rescaleX(x2).domain());
		Line_chart.select(".line").attr("d", line);
		focus.select(".axis--x").call(xAxis);
		context.select(".brush2").call(brush.move, x.range().map(t.invertX, t));
		
		let min = x.domain()[0];
		let range = x.domain()[1]-x.domain()[0];
		let offset = range*.1;
		d3.select('.brush')
				.call(brush.move, [min,min+offset].map(x));
	}

}; // End of draw()

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

function updateDropdown(channelNames)
{
  var i=0;
  d3.select("#dropdown")
    .selectAll('myOptions')
    .data(channelNames)
    .enter()
    .append('option')
    .text(function (d) { return d; }) // text showed in the menu
    .attr("value", function () { return i++; }) // corresponding value
};

function isNumber(num)
{
	var reg = /^-?\d+\.?\d*$/
	return reg.test(num);
}

function findClosestIdx(val, arr)
{
  var closest = arr.reduce(function(prev, curr) {
    return (Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev);
  });

  let idx= arr.indexOf(closest);

  return idx;
}

/**
 * Use this function to draw a raw plot from a local .csv file.
 * @param {string} file - the .csv file you wish to read in
 * @param {number} freq - the sampling frequency of the data
 */
 function drawRawFromFile(file, freq)
 {

	 d3.csv(file, 
		 function(error, data) {
			 if (error) throw error;
			 // Parse out channel names
			 var channelNames = d3.keys(data[0]);
 
			 // Update the dropdown with the channel names
			 updateDropdown(channelNames)
 
			 // Get the EEG Data from the .csv file
			 var allData = getEEGData(channelNames, data, freq);
 
			 // Plot the first channel's data
			 draw(allData[0], freq);
			 
			 
			 // Dropdown change behavior
			 d3.select("#dropdown").on("change", function(d) {
				 // recover the option that has been chosen
				 var selectedOption = d3.select(this).property("value");
				 
				 // Remove and then redraw the plot
				 d3.select("svg").remove();
				 //TODO: Don't hard code this in.. Get the HTML
				 document.getElementById("plot").innerHTML= "<svg width='1200' height='550'></svg>";
				 draw(allData[selectedOption], freq);
			 });
			 
	 });
 };
 
 drawRawFromFile("A114_raw_512HZ.csv", 512);
