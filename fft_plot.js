function draw(d, freq) {
  // Extract data and channel name
  let data = d.value;
  let channel = d.channel;
	console.log(data);
  d3.select("#title")
    .text(channel)
    .attr("transform", "translate(" + width / 2 + ", 0)");

  var svg = d3.select("svg"),
    margin = { top: 20, right: 20, bottom: 170, left: 60 },
    margin2 = { top: 430, right: 20, bottom: 30, left: 60 },
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
  var brush = d3
    .brushX()
    .extent([
      [0, 0],
      [width, height],
    ])
    .on("brush end", brushed);

  // The brush for the context (zooming)
  var brush2 = d3
    .brushX()
    .extent([
      [0, 0],
      [width, height2],
    ])
    .on("brush end", brushedZoom);

  var line = d3
    .line()
    .x(function (d) {
      return x(d.time);
    })
    .y(function (d) {
      return y(d.amplitude);
    });

  var line2 = d3
    .line()
    .x(function (d) {
      return x2(d.time);
    })
    .y(function (d) {
      return y2(d.amplitude);
    });

  var clip = svg
    .append("defs")
    .append("svg:clipPath")
    .attr("id", "clip")
    .append("svg:rect")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 0)
    .attr("y", 0);

  var Line_chart = svg
    .append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("clip-path", "url(#clip)");

  var focus = svg
    .append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var context = svg
    .append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

  x.domain(
    d3.extent(data, function (d) {
      return d.time;
    })
  );
  y.domain(
    d3.extent(data, function (d) {
      return d.amplitude;
    })
  );
  x2.domain(x.domain());
  y2.domain(y.domain());

  focus
    .append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  focus.append("g").attr("class", "axis axis--y").call(yAxis);

  let min = x.domain()[0];
  let range = x.domain()[1] - x.domain()[0];
  let offset = range * 0.1;
  focus
    .append("g")
    .attr("class", "brush")
    .call(brush)
    .call(brush.move, [min, min + offset].map(x));

  Line_chart.append("path").datum(data).attr("class", "line").attr("d", line);

  context.append("path").datum(data).attr("class", "line").attr("d", line2);

  context
    .append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height2 + ")")
    .call(xAxis2);

  context
    .append("g")
    .attr("class", "brush2")
    .call(brush2)
    .call(brush2.move, x.range());

  // Event listeners to move the brush
  d3.select("#window_button").on("click", moveBrush);
  d3.selectAll("input").on("change", moveBrush);
  $("input").keyup(function (event) {
    if (event.which === 13) {
      moveBrush();
    }
  });

  $("input").attr({
    max: x.domain()[1],
    min: x.domain()[0],
  });

  function moveBrush() {
    var start = d3.select("#window_start").property("value");
    var end = d3.select("#window_end").property("value");

    var valid = isNumber(start) && isNumber(end);
    if (valid) {
      start = parseFloat(start);
      end = parseFloat(end);
    }
    //console.log(`start: ${start}  end: ${end}`);
    //console.log(`typeof start: ${typeof start}  typeof end: ${typeof end}`);

    var msg;
    if (!valid) {
      msg = `Error: ${
        !isNumber(start) ? "Starting input" : "Ending input"
      } is not a valid number.`;
    } else if (start > end) {
      msg = `Error: Incorrect window range. Start time cannot be greater than end time.`;
      valid = false;
    } else if (end < start) {
      msg = `Error: Incorrect window range. End time cannot be less than start time.`;
      valid = false;
    } else if (start < x.domain()[0] || end < x.domain()[0]) {
      msg = `Error: Invalid input. ${
        start < x.domain()[0] ? start : end
      } is less than min domain ${x.domain()[0]}`;
      valid = false;
    } else if (start > x.domain()[1] || end > x.domain()[1]) {
      msg = `Error: Invalid input. ${
        start > x.domain()[0] ? start : end
      } is greater than max domain ${x.domain()[1]}`;
      valid = false;
    } else {
      $("#window_alert").hide();
      d3.select(".brush").call(brush.move, [start, end].map(x));
    }

    if (!valid) {
      $("#window_alert").text(msg);
      $("#window_alert").show();
    }
  }

  function brushed() {
    var extent = d3.event.selection;
    output(extent);
  }

  function output(extent) {
    if (extent) {
	  // Hide the alert if it is a valid window size
	  $("#window_alert").hide();
	  $('#output').show();

      // Get lower/upper bounds of the window (time)
      var time_range = extent.map(x.invert, x);

      // Parse out the time data from the original dataset
      let tData = data.map((a) => a.time);
      let aData = data.map((a) => a.amplitude);

      // Calulate the upper and lower indexes of original dataset
      var lower = findClosestIdx(time_range[0], tData);
      var upper = findClosestIdx(time_range[1], tData);

      // Slice out the original data based on the window selection
      var windowData = aData.slice(lower, upper + 1);

      // Output the length/range of the window
      document.getElementById("window_len").innerText = `Window length: ${(time_range[1] - time_range[0]).toFixed(3)} seconds`;
      document.getElementById("window_range").innerText = `Window range: ${time_range[0].toFixed(3)} sec to ${time_range[1].toFixed(3)} sec`;

      // Update the time range input boxes (if brush is dragged)
      document.getElementById("window_start").value = time_range[0].toFixed(3);
      document.getElementById("window_end").value = time_range[1].toFixed(3);

      // TODO: Add code for calculation FFTs, Bandpower, Visualizations, etc using the windowData...
      let bandpower = bci.bandpower(windowData, freq, [
        "delta",
        "theta",
        "alpha",
        "beta",
        "gamma",
      ]);
      document.getElementById("delta_bp").innerText = `Delta Bandpower: ${bandpower[0].toFixed(3)}`;
      document.getElementById("theta_bp").innerText = `Theta Bandpower: ${bandpower[1].toFixed(3)}`;
      document.getElementById("alpha_bp").innerText = `Alpha Bandpower: ${bandpower[2].toFixed(3)}`;
      document.getElementById("beta_bp").innerText = `Beta Bandpower: ${bandpower[3].toFixed(3)}`;
      document.getElementById("gamma_bp").innerText = `Gamma Bandpower: ${bandpower[4].toFixed(3)}`;

	  // FFT STUFF?????????????????????????????????????????????????
			doFFT(windowData);
	  //?????????????????????????????????????????????????????????????????????
    } else {
	  $("#window_alert").text("Please select a nonzero window size.");
	  $("#window_alert").show();
	  $('#output').hide();
    }
  }

	function doFFT(data){
		var real = data;
	  var imaginary = new Array(real.length);
	  imaginary.fill(0);

	  var fft = new FFT();
	  fft.calc(1, real, imaginary);
	  //console.log(real);
	  //console.log(imaginary);

		// Calculate the freqency components
		/*
		let Fs = 512.0;
		var maxFreq = Fs/2.0 - Fs/data.length;
		var delF = Fs/data.length;
		var freq = [];
		console.log(maxFreq);
		for(let i=0; i< maxFreq; i+=delF){
			freq.push(i);
		}
		//console.log(freq);
		*/
		var freq=[];
		let Fs = 512.0;
		for(let i=0; i<real.length;i++){
			let fq= Fs*i/real.length;
			freq.push(fq);
		}
		//console.log(freq);

		var mag = [];
		for(let i=0; i<real.length; i++){
			mag.push(Math.sqrt(Math.pow(real[i], 2) + Math.pow(imaginary[i], 2))/real.length);
		}

		fftData = [];
		for(let i=5; i<real.length-5; i++){
			pt = {
				frequency: freq[i],
				magnitude: mag[i]
			}
			fftData.push(pt);
		}
		console.log(fftData);

		// Remove and then redraw the plot
		d3.select("#my_fft_plot").remove();
		//TODO: Don't hard code this in.. Get the HTML
		$("#hi_there").html("<div id = 'my_fft_plot'></div>");
		drawFFT(fftData)

	}

	function drawFFT(data){
		// set the dimensions and margins of the graph
		var margin3 = {top: 10, right: 30, bottom: 30, left: 60},
		width3 = 1200 - margin3.left - margin3.right,
		height3 = 550 - margin3.top - margin3.bottom;

		// append the svg object to the body of the page
		var svg3 = d3.select("#my_fft_plot")
		.append("svg")
		.attr("width", width3 + margin3.left + margin3.right)
		.attr("height", height3 + margin3.top + margin3.bottom)
		.append("g")
		.attr("transform",
					"translate(" + margin3.left + "," + margin3.top + ")");

		//let data3 = data;
		var data3 = data;

		// Add X axis --> it is a date format
		var x3 = d3.scaleLinear()
			.domain(d3.extent(data3, function(d) { return d.frequency; }))
			.range([ 0, width3 ]);
		svg3.append("g")
			.attr("transform", "translate(0," + height3 + ")")
			.call(d3.axisBottom(x3));

		// Add Y axis
		var y3 = d3.scaleLinear()
			.domain(d3.extent(data3, function(d) { return d.magnitude; }))
			.range([ height3, 0 ]);
		svg3.append("g")
			.call(d3.axisLeft(y3));

		// Add the line
		svg3.append("path")
			.datum(data3)
			.attr("fill", "none")
			.attr("stroke", "steelblue")
			.attr("stroke-width", 1.5)
			.attr("d", d3.line()
				.x(function(d) { return x3(d.frequency) })
				.y(function(d) { return y3(d.magnitude) })
				)
	}



  function brushedZoom() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
    var s = d3.event.selection || x2.range();
    x.domain(s.map(x2.invert, x2));
    Line_chart.select(".line").attr("d", line);
    focus.select(".axis--x").call(xAxis);

    let min = x.domain()[0];
    let range = x.domain()[1] - x.domain()[0];
    let offset = range * 0.1;
    d3.select(".brush").call(brush.move, [min, min + offset].map(x));
    $("input").attr({
      max: x.domain()[1],
      min: x.domain()[0],
    });
  }

} // End of draw()

function getChannelData(channel, data, freq) {
  let d = data.map((a) => a[channel]).map(Number);
  let result = [];
  let t = 0;
  for (let i = 0; i < d.length; i++) {
    result.push({
      amplitude: d[i],
      time: t,
    });
    t += 1 / freq;
  }
  return result;
}

function getEEGData(channelNames, data, freq) {
  let d = [];
  for (let i = 0; i < channelNames.length; i++) {
    let channelData = getChannelData(channelNames[i], data, freq);
    //console.log(channelNames[i]);
    //console.log(channelData);
    d.push({ channel: channelNames[i], value: channelData });
  }
  return d;
}

function updateDropdown(channelNames) {
  var i = 0;
  d3.select("#dropdown")
    .selectAll("myOptions")
    .data(channelNames)
    .enter()
    .append("option")
    .text(function (d) {
      return d;
    }) // text showed in the menu
    .attr("value", function () {
      return i++;
    }); // corresponding value
}

function isNumber(num) {
  var reg = /^-?\d+\.?\d*$/;
  return reg.test(num);
}

function findClosestIdx(val, arr) {
  var closest = arr.reduce(function (prev, curr) {
    return Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev;
  });

  let idx = arr.indexOf(closest);

  return idx;
}

/**
 * Use this function to draw a raw plot from a local .csv file.
 * @param {string} file - the .csv file you wish to read in
 * @param {number} freq - the sampling frequency of the data
 */
function drawRawFromFile(file, freq) {
  d3.csv(file, function (error, data) {
    if (error) throw error;
    // Parse out channel names
    var channelNames = d3.keys(data[0]);

    // Update the dropdown with the channel names
    updateDropdown(channelNames);

    // Get the EEG Data from the .csv file
    var allData = getEEGData(channelNames, data, freq);

    // Plot the first channel's data
    draw(allData[0], freq);

    // Dropdown change behavior
    d3.select("#dropdown").on("change", function (d) {
      // recover the option that has been chosen
      var selectedOption = d3.select(this).property("value");

      // Remove and then redraw the plot
      d3.select("svg").remove();
      //TODO: Don't hard code this in.. Get the HTML
      document.getElementById("plot").innerHTML =
        "<svg width='1200' height='550'></svg>";
      draw(allData[selectedOption], freq);
    });
  });
}

drawRawFromFile("A114_raw_512HZ.csv", 512);
