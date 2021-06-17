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

function draw(d, id, freq){
  // Extract data and channel name
  let data = d.value;
  let channel = d.channel;

  // Set the dimensions and margins of the graph
  var margin = {top: 10, right: 30, bottom: 30, left: 60},
  width = 1200 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

  // Append the svg object to the body of the page
  var svg = d3.select('#'+id)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");
      
  // Add X axis
  var x = d3.scaleLinear()
    .domain(d3.extent(data, function(d) { return d.time; }))
    .range([ 0, width ]);
  xAxis = svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));
     
  // Add text label for the x axis
  svg.append("text")             
  .attr("transform",
      "translate(" + (width/2) + " ," + 
                      (height + margin.top + 20) + ")")
  .style("text-anchor", "middle")
  .text("Time");

  // Add Y axis
  var y = d3.scaleLinear()
  .domain(d3.extent(data, function(d) { return d.amplitude; }))
  .range([ height, 0 ]);
  yAxis = svg.append("g")
  .call(d3.axisLeft(y));

  // Add text label for the y axis
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x",0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Amplitude");   

  // Add Title
  d3.select("#title")
    .text(channel)
    .attr("transform",
    "translate(" + (width/2) + ", 0)");  

  // Add the line
  line = svg.append("path")
    .datum(data)
    .attr("class", "line")  // I add the class line to be able to modify this line later on.
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
      .x(function(d) { return x(d.time) })
      .y(function(d) { return y(d.amplitude) })
    )

	// Add brushing
	var brush = d3.brushX()                
		.extent( [ [0,0], [width,height] ] )  
		.on("start brush end", brushed)
  // Add the brushing
 svg
    .append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.move, [0,10].map(x));
    // TODO: add functionality to change the brush width based on inputing the number of seconds

	// Move window to selected time range
	d3.select("#window_button").on("click", function(d) {
	
		var start = d3.select("#window_start").property("value");
		var end = d3.select("#window_end").property("value");

		if(!isNumber(start) || !isNumber(end)){
			alert(`Error: ${!isNumber(start) ? "Starting input" : "Ending input"} is not a valid number.`);
		} else if(start > end){
			alert(`Error: Incorrect window range. Start time cannot be greater than end time.`);
		} else if (end < start){
			alert(`Error: Incorrect window range. End time cannot be less than start time.`);
		} else if(start < x.domain()[0] || end < x.domain()[0]){
			alert(`Error: Invalid input. ${start < x.domain()[0] ? start : end} is less than ${x.domain()[0]}`);
		} else if (start > x.domain()[1] || end > x.domain()[1]){
			alert(`Error: Invalid input. ${start > x.domain()[0] ? start : end} is greater than ${x.domain()[1]}`);
		} else {
			d3.select('.brush')
				.call(brush.move, [start ,end].map(x));
		}

	});

  // A function that update the chart for given boundaries
  function brushed() {
    // Get window area
    var extent = d3.event.selection;

    // Get lower/upper bounds of the window (time)
    var time_range = extent.map(x.invert, x);
    
    // Parse out the time data from the original dataset
    let tData = data.map(a => a.time);
		let aData = data.map(a => a.amplitude);

    // Calulate the upper and lower indexes of original dataset
    var lower = findClosestIdx(time_range[0], tData);
    var upper = findClosestIdx(time_range[1], tData);
    //console.log(`lower: ${lower} upper: ${upper}`);

    // Slice out the original data based on the window selection
    var windowData = aData.slice(lower, upper+1);
    console.log(windowData);
		
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

/**
 * Use this function to draw a raw plot from a local .csv file.
 * @param {string} file - the .csv file you wish to read in
 * @param {number} freq - the sampling frequency of the data
 * @param {string} id - the id of the HTML element you wish you place the raw plot
 */
function drawRawFromFile(file, freq, id)
{
  d3.csv(file, 
    function(data) {
      // Parse out channel names
      var channelNames = d3.keys(data[0]);

      // Update the dropdown with the channel names
      updateDropdown(channelNames)

      // Get the EEG Data from the .csv file
      var allData = getEEGData(channelNames, data, freq);

      // Plot the first channel's data
      draw(allData[0], id, freq);
      
      // Dropdown change behavior
      d3.select("#dropdown").on("change", function(d) {
        // recover the option that has been chosen
        var selectedOption = d3.select(this).property("value");
        
        // Remove and then redraw the plot
        d3.select("svg").remove();
        draw(allData[selectedOption], id);
      });
  });
};

drawRawFromFile("A114_raw_512HZ.csv", 512, "line_plot1");