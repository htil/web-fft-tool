function draw(d, freq) {
  let data = d.value;
  let channel = d.channel;
  

  d3.select("#title")
    .text(channel)
    .attr("transform", "translate(" + width / 2 + ", 0)");

  var svg = d3.select("svg"),
    margin = { top: 20, right: 20, bottom: 170, left: 60 },
    margin2 = { top: 430, right: 20, bottom: 50, left: 60 },
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

	// Add text label for the x axis
		svg.append("text")             
		.attr("transform",
				"translate(" + (width/2) + " ," + 
												(height + margin.bottom + 10) + ")")
		.style("text-anchor", "middle")
		.text("Time (s)");

		svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left+55)
    .attr("x",0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Amplitude");   

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
			doFFT(windowData, freq);
	  //?????????????????????????????????????????????????????????????????????
    } else {
			$("#window_alert").text("Please select a nonzero window size.");
			$("#window_alert").show();
			$('#output').hide();
    }
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

function magToDb(b) {
	var ret = [];
	for (var cnt = 0; cnt < b.length; cnt++) {
		ret.push(20 * Math.log(b[cnt]) * Math.LOG10E);
	}
	return ret;
}

function doFFT(data, Fs){
	// Set up arrays for real and imaginary components
	var real = data;
	var imaginary = new Array(real.length);
	imaginary.fill(0);

	// Calculate the fft
	var fft = new FFT();
	fft.calc(1, real, imaginary);

	// Calculate frequencies
	let freq = fft.frequencies(real, imaginary, Fs);

	// Calculate magnitudes, divide by N
	let mag = fft.amplitude(real, imaginary);
	mag = mag.map(x => x/data.length);
	//mag = magToDb(mag);
	//mag = mag.map(x => 20*Math.log10(Math.abs(x)));

	// Create the dataset for the d3 chart
	fftData = [];
	for(let i=0; i<freq.length; i++){
		let pt = {
			frequency: freq[i],
			magnitude: mag[i]
			//magnitude: real[i]
		}
		fftData.push(pt);
	}

	// Remove and then redraw the plot
	d3.select("#fft_plot").remove();
	//TODO: Don't hard code this in.. Get the HTML
	$("#fft_div").html("<div id = 'fft_plot'></div>");

	// Exclude the first 5 points
	//drawFFT(fftData.slice(15));
	drawFFT(fftData);

}

function drawFFT(data_fft){
	// set the dimensions and margins of the graph
	var margin_fft = {top: 10, right: 30, bottom: 50, left: 60},
	width_fft = 900 - margin_fft.left - margin_fft.right,
	height_fft = 550 - margin_fft.top - margin_fft.bottom;

	// append the svg object to the body of the page
	var svg_fft = d3.select("#fft_plot")
	.append("svg")
	.attr("width", width_fft + margin_fft.left + margin_fft.right)
	.attr("height", height_fft + margin_fft.top + margin_fft.bottom)
	.append("g")
	.attr("transform",
				"translate(" + margin_fft.left + "," + margin_fft.top + ")");

	// Add X axis --> it is a date format
	var x_fft = d3.scaleLinear()
		.domain(d3.extent(data_fft, function(d) { return d.frequency; }))
		.range([ 0, width_fft ]);
	svg_fft.append("g")
		.attr("transform", "translate(0," + height_fft + ")")
		.call(d3.axisBottom(x_fft));

	// Add Y axis
	var y_fft = d3.scaleLinear()
		.domain(d3.extent(data_fft, function(d) { return d.magnitude; }))
		.range([ height_fft, 0 ]);
	svg_fft.append("g")
		.call(d3.axisLeft(y_fft));

	svg_fft.append("text")             
		.attr("transform",
				"translate(" + (width_fft/2) + " ," + 
												(height_fft + margin_fft.top + 30) + ")")
		.style("text-anchor", "middle")
		.text("Frequency (Hz)");

		svg_fft.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin_fft.left)
    .attr("x",0 - (height_fft / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Magnitude");   

	// Add the line
	svg_fft.append("path")
		.datum(data_fft)
		.attr("fill", "none")
		.attr("stroke", "steelblue")
		.attr("stroke-width", 1.5)
		.attr("d", d3.line()
			.x(function(d) { return x_fft(d.frequency) })
			.y(function(d) { return y_fft(d.magnitude) })
			)
}

function getColumnData(channel, data, freq) {
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

function addTimeData(columnNames, data, freq) {
  let d = [];
  for (let i = 0; i < columnNames.length; i++) {
    let channelData = getColumnData(columnNames[i], data, freq);
    d.push({ channel: columnNames[i], value: channelData });
  }
  return d;
}

function updateDropdown(columnNames) {
  var i = 0;
  d3.select("#dropdown")
    .selectAll("myOptions")
    .data(columnNames)
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
 * This function is deprecated after the addition of the load file option...
 */
/*
function drawRawFromFile(file) {
  $("#data_loaded").show();

  d3.csv(file, function (error, data) {
    if (error) throw error;
    // Parse out channel names
    var channelNames = d3.keys(data[0]);

    // Update the dropdown with the channel names
    updateDropdown(channelNames);

    // Get the EEG Data from the .csv file
    let freq = parseInt($("#sampling_freqency").val());
    var allData = getEEGData(channelNames, data, freq);

    // Plot the first channel's data
    draw(allData[0]);

    // Dropdown change behavior
    d3.select("#dropdown").on("change", function (d) {
      // recover the option that has been chosen
      var selectedOption = d3.select(this).property("value");

      // Remove and then redraw the plot
      d3.select("svg").remove();
      //TODO: Don't hard code this in.. Get the HTML
      document.getElementById("plot").innerHTML = "<svg width='1200' height='550'></svg>";
      draw(allData[selectedOption]);
    });

  });
}
*/
//TODO: Bandpass filtering? https://github.com/markert/fili.js

//drawRawFromFile("data/righthand-testing.csv");

var reader = new FileReader();  

function disp_filename(){
  let filepath = $("#txtFileUpload").val();
  var fileName = /([^\\]+)$/.exec(filepath)[1];
	let fileExtension = fileName.substr((fileName.lastIndexOf('.') + 1));
	if(fileExtension==="csv"){
		$("#invalid_f").hide();
		$("#finput_txt").html("&nbspUploaded file: <i class='fas fa-file-csv' style='padding-bottom: 10px'></i>&nbsp"+fileName);
		$("#after_file").show();
	}
	else{
		$("#invalid_f").text(`Error: ${fileExtension} is not a supported file type. Please upload a .csv file.`);
		$("#invalid_f").show();
		$("#after_file").hide();
	}

}
    
function loadFile() {  
  let freq = parseInt($("#sampling_freqency").val());
  if((freq < 128)){
    alert("Invalid or empty sampling frequency! Please input a valid sampling frequency greater than 128.");
    return;
  }
  
  var file = document.querySelector('input[type=file]').files[0];  
	reader.addEventListener('error', () => {
		alert(`Error reading ${file.name}.`);
	});    
  reader.addEventListener("load", parseFile, false);
  if (file) {
    reader.readAsText(file);
  }

}


function parseResult(result) {
	var resultArray = [];
	result.split("\n").forEach(function(row) {
			var rowArray = [];
			row.split(",").forEach(function(cell) {
					rowArray.push(cell);
			});
			resultArray.push(rowArray);
	});
	return resultArray;
}
function createTable(array) {
	var content = "";
	array.forEach(function(row) {
			content += "<tr>";
			row.forEach(function(cell) {
					content += "<td>" + cell + "</td>" ;
			});
			content += "</tr>";
	});
	$("#table_content").html(content);
	$("#table_content").hide();
}

var allData=[];
function parseFile(){
  var data = d3.csvParse(reader.result);

	let arr = parseResult(reader.result);
	createTable(arr);

  if(data){
    var freq = parseInt($("#sampling_freqency").val());
    $("#data_loaded").show();
    $("#file-upload-div").hide();
  
    var columnNames = d3.keys(data[0]);
    // Update the dropdown with the channel names
    updateDropdown(columnNames);
    // Get the EEG Data from the .csv file
    allData = addTimeData(columnNames, data, freq);
    // Plot the first channel's data
    draw(allData[0], freq);

  }
}


  // Dropdown change behavior
$("#dropdown").on("change", function (d) {
    var freq = parseInt($("#sampling_freqency").val());
    console.log(freq);
    // recover the option that has been chosen
    var selectedOption = d3.select("#dropdown").property("value");

    // Remove and then redraw the plot
    d3.select("svg").remove();
    //TODO: Don't hard code this in.. Get the HTML
    document.getElementById("plot").innerHTML = "<svg width='900' height='550'></svg>";
    draw(allData[selectedOption], freq);
  });

	$("#show_data").on("change", function(){
		if($('#show_data').is(":checked")){
			$('#table_content').show(); 
			$("#graphing_div").hide();
		}
		else{
			$('#table_content').hide(); 
			$("#graphing_div").show();
		}
	});
