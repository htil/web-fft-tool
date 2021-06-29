function draw(data, freq) {
  var svg = d3.select("svg"),
    margin = {top: 10, right: 30, bottom: 50, left: 60},
    width = 800 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  var x = d3.scaleLinear().range([0, width]),
    y = d3.scaleLinear().range([height, 0]);

  var xAxis = d3.axisBottom(x),
    yAxis = d3.axisLeft(y);

	svg.append("text")             
		.attr("transform",
				"translate(" + (width/2) + " ," + 
												(height + margin.top + 30) + ")")
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

    
  var line = d3
    .line()
    .x(function (d) {
      return x(d.time);
    })
    .y(function (d) {
      return y(d.amplitude);
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

  x.domain(
    d3.extent(data, function (d) {
      return d.time;
    })
  );
  y.domain(
    [-10*max_signal, 10*max_signal]
  );

  focus
    .append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  focus.append("g").attr("class", "axis axis--y").call(yAxis);

  focus
    .append("g")
    .attr("class", "brush")
    .call(brush)
    .call(brush.move, x.range());

  Line_chart.append("path").datum(data).attr("class", "line").attr("d", line);

  // Event listeners to move the brush
  d3.select("#window_button").on("click", moveBrush);
  d3.selectAll(".window_control").on("change", moveBrush);
  $(".window_control").keyup(function (event) {
    if (event.which === 13) {
      moveBrush();
    }
  });

  $(".window_control").attr({
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
      //console.log(windowData.length);

      // Update the time range input boxes (if brush is dragged)
      document.getElementById("window_start").value = time_range[0].toFixed(3);
      document.getElementById("window_end").value = time_range[1].toFixed(3);


      // Do the FFT
			doFFT(windowData, freq);

    } else {
			$("#window_alert").text("Please select a nonzero window size.");
			$("#window_alert").show();
			$('#output').hide();
    }
  }


} // End of draw()


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
	drawFFT(fftData.slice(15));
	//drawFFT(fftData);

}

function drawFFT(data_fft){
	// set the dimensions and margins of the graph
	var margin_fft = {top: 10, right: 30, bottom: 50, left: 60},
	width_fft = 800 - margin_fft.left - margin_fft.right,
	height_fft = 400 - margin_fft.top - margin_fft.bottom;

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
												(height_fft + margin_fft.top + 25) + ")")
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
    draw(allData[0].value, freq);
    $("#title").html(allData[0].channel);

    // Dropdown change behavior
    d3.select("#dropdown").on("change", function (d) {
      // recover the option that has been chosen
      var selectedOption = d3.select(this).property("value");
      $("#title").html(allData[selectedOption].channel);

      // Remove and then redraw the plot
      d3.select("svg").remove();
      //TODO: Don't hard code this in.. Get the HTML
      document.getElementById("plot").innerHTML = "<svg width='800' height='400'></svg>";
      draw(allData[selectedOption].value, freq);
    });
  });
}

function convertToD3Data(d, freq) {
  let result = [];
  for (let i = 0; i < d.length; i++) {
    result.push({
      amplitude: d[i],
      time: i/freq,
    });
  }
  return result;
}


function drawWave(){
  let sampleRate = parseInt($("#sampleRateInput").val());
  let duration = parseInt($("#signalDurationInput").val());

	var amp = $('.amp_value').map((_,el) => el.value).get();
	var freq = $('.freq_value').map((_,el) => el.value).get();

  let signal = bci.generateSignal(amp, freq, sampleRate, duration);
  var gen = convertToD3Data(signal, sampleRate);
  d3.select("svg").remove();
  //TODO: Don't hard code this in.. Get the HTML
  document.getElementById("plot").innerHTML = "<svg width='800' height='400'></svg>";

  draw(gen, sampleRate);
}

var regex = /^(.+?)(\d+)$/i;
var cloneIndex = $(".clonedInput").length+1;
var max_signal = 5;
function clone(){
		$("#clonedInput1").clone()
        .appendTo("#signal_gen")
        .attr("id", "clonedInput" +  cloneIndex)
        .find("*")
        .each(function() {
						if(this.id === "ampLabel"){
							this.innerHTML = `Amplitude ${cloneIndex}:`;
						}
						if(this.id === "freqLabel"){
							this.innerHTML = `Frequency ${cloneIndex}:&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp`;
						}
						if(this.id.includes("amplitudeRange")){
							//this.attributes.onchange.nodeValue = `$('#amplitudeInput${cloneIndex}').val(this.value)`;
							$(this).val(5);
							$(this).attr("onchange", `$('#amplitudeInput${cloneIndex}').val(this.value); drawWave();`);
						}
						if(this.id.includes("frequencyRange")){
							$(this).val(25);
							$(this).attr("onchange", `$('#frequencyInput${cloneIndex}').val(this.value); drawWave();`);
						}
						if(this.id.includes("amplitudeInput")){
							$(this).val(5);
							$(this).attr("onchange", `$('#amplitudeRange${cloneIndex}').val(this.value); drawWave();`);
						}
						if(this.id.includes("frequencyInput")){
							$(this).val(25);
							$(this).attr("onchange", `$('#frequencyRange${cloneIndex}').val(this.value); drawWave();`);
						}
						if(this.id.includes("removeButton")){
							$(this).show();
						}
            var id = this.id || "";
            var match = id.match(regex) || [];
            if (match.length == 3) {
                this.id = match[1] + (cloneIndex);
            }
        })
        .on('click', 'button.remove', remove);
    cloneIndex++;
}
function remove(){
		if($(this).attr('id') === "removeButton1") return;
    $(this).parents(".clonedInput").remove();
		//cloneIndex--;
		drawWave();
}
$("button.clone").on("click", add_signal);
$("button.remove").on("click", remove);

function add_signal(){
  if($(".clonedInput").length == max_signal) return;
	clone();
	drawWave();
}

drawWave();



