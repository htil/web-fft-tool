// Set the height and width for the graphs
var graph_width = 900;
var graph_height = 550;

// Draw the graphs
function draw(d, freq) {
  let data = d.value;
  let channel = d.channel;

  // Raw data title (name of the column)
  d3.select("#title")
    .text(channel)
    .attr("transform", "translate(" + width / 2 + ", 0)");

  // Set the margins for the raw data
  var svg = d3.select("svg"),
    margin = { top: 20, right: 20, bottom: 170, left: 60 },
    margin2 = { top: 430, right: 20, bottom: 50, left: 60 },
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    height2 = +svg.attr("height") - margin2.top - margin2.bottom;

  // Set the ranges for the axis
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
   
  // Set the label for the y axis
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

  // The line for the focus
  var line = d3
    .line()
    .x(function (d) {
      return x(d.time);
    })
    .y(function (d) {
      return y(d.amplitude);
    });

  // The line for the context
  var line2 = d3
    .line()
    .x(function (d) {
      return x2(d.time);
    })
    .y(function (d) {
      return y2(d.amplitude);
    });

  // Add the clippath for brushing
  var clip = svg
    .append("defs")
    .append("svg:clipPath")
    .attr("id", "clip")
    .append("svg:rect")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 0)
    .attr("y", 0);

  // Add the clippath to the svg
  var Line_chart = svg
    .append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("clip-path", "url(#clip)");

  // Add the focus to the svg
  var focus = svg
    .append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Add the context to the svg
  var context = svg
    .append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

  // Add the domain for the axis
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

  // Call the axis
  focus
    .append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  focus.append("g").attr("class", "axis axis--y").call(yAxis);

  // Set the inital brush width to 10%
  let min = x.domain()[0];
  let range = x.domain()[1] - x.domain()[0];
  let offset = range * 0.1;
  focus
    .append("g")
    .attr("class", "brush")
    .call(brush)
    .call(brush.move, [min, min + offset].map(x));

  // Add the lines to the focus and context
  Line_chart.append("path").datum(data).attr("class", "line").attr("d", line);

  context.append("path").datum(data).attr("class", "line").attr("d", line2);

  context
    .append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height2 + ")")
    .call(xAxis2);

  // Add the brush for the context
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

  $(".window_control").attr({
    max: x.domain()[1],
    min: x.domain()[0],
  });

  // Move the brush based on text input for window start/stop
  function moveBrush() {
    var start = d3.select("#window_start").property("value");
    var end = d3.select("#window_end").property("value");
    // Make sure the start and end times are numbers
    var valid = isNumber(start) && isNumber(end);
    if (valid) {
      start = parseFloat(start);
      end = parseFloat(end);
    }

    // Input validation
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

  // Handler for when the brush moves
  function brushed() {
    var extent = d3.event.selection;
    output(extent);
  }

  // Extract the data and output the results of the FFT
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

      // Update the time range input boxes (if brush is dragged)
      document.getElementById("window_start").value = time_range[0].toFixed(3);
      document.getElementById("window_end").value = time_range[1].toFixed(3);

      // Calculate and plot the FFT
      doFFT(windowData, freq);

    } else {
      $("#window_alert").text("Please select a nonzero window size.");
      $("#window_alert").show();
      $('#output').hide();
    }
  }

  // Zoom when the brush on the context selects a new range of data
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

function isPowerOfTwo(n)
{
  if (n == 0)
    return false;

  return parseInt( (Math.ceil((Math.log(n) / Math.log(2))))) == parseInt( (Math.floor(((Math.log(n) / Math.log(2))))));
}

function doFFT(data, Fs){
  let signal = data;

  let len = data.length;
  // signal length for the FFT needs to be a power of 2
  let fft_len = len;
  if (!isPowerOfTwo(len)){
    // Find the nearest power of two (rounded up)
    let nearest_power = Math.ceil(Math.log2(len));
    fft_len = Math.pow(2, nearest_power);
    // 0 pad the signal so its length is a power of 2
    let padding = fft_len - len;
    for(let i=0; i<padding; i++){
      signal.push(0);
    }
  }
  
  // do a forward FFT on the signal
  var fft = new FFT(fft_len, Fs);
  fft.forward(signal);
	let mag = fft.spectrum;

  // Create the dataset for the d3 chart
  fftData = [];
  for(let i=0; i<fft.spectrum.length; i++){
    let pt = {
      frequency: i*Fs/2/fft.spectrum.length,
      magnitude: mag[i]
    }
    fftData.push(pt);
  }

  // Remove and then redraw the plot
  d3.select("#fft_plot").remove();
  //TODO: Don't hard code this in.. Get the HTML
  $("#fft_div").html("<div id = 'fft_plot'></div>");

  drawFFT(fftData);
}

function drawFFT(data_fft){
  // set the dimensions and margins of the graph
  var margin_fft = {top: 10, right: 30, bottom: 50, left: 60},
  width_fft = graph_width - margin_fft.left - margin_fft.right,
  height_fft = graph_height - margin_fft.top - margin_fft.bottom;

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
    //.domain([0, 125])
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

  // Add x axis label
  svg_fft.append("text")             
    .attr("transform",
        "translate(" + (width_fft/2) + " ," + 
                        (height_fft + margin_fft.top + 30) + ")")
    .style("text-anchor", "middle")
    .text("Frequency (Hz)");

    // Add y axis label
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

// Extract data from each column, add the appropriate time data
function getColumnData(channel, data, freq, time_exists, time) {
  let d = data.map((a) => a[channel]).map(Number);
  let result = [];
  let t = 0;
  for (let i = 0; i < d.length; i++) {
    result.push({
      amplitude: d[i],
      time: time_exists ? time[i]: t,
    });
    t += 1 / freq;
  }
  return result;
}

// Add the appropriate time data and get into a d3 compatible object
function addTimeData(columnNames, data, freq, time_exists) {
  let d = [];
  let start_idx = time_exists ? 1 : 0;
  let time_array = [];
  if(time_exists){
    time_array = data.map((a) => a[columnNames[0]]).map(Number);
  }
  for (let i = start_idx; i < columnNames.length; i++) {
    let channelData = getColumnData(columnNames[i], data, freq, time_exists, time_array);
    d.push({ channel: columnNames[i], value: channelData });
  }
  return d;
}

// Update the dropdown with the column names
function updateDropdown(columnNames) {
  var i = 0;
  d3.select("#dropdown")
    .selectAll("myOptions")
    .data(columnNames)
    .enter()
    .append("option")
    .text(function (d) {
      return d;
    })
    .attr("value", function () {
      return i++;
    });
}

// Helper functions for extracting data for the window
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

// File read in starts here
var reader = new FileReader();  

// Function to display filename and settings when file is selected
function disp_filename(){
  // Extract just the file name and extension from full path
  let filepath = $("#txtFileUpload").val();
  var fileName = /([^\\]+)$/.exec(filepath)[1];
  let fileExtension = fileName.substr((fileName.lastIndexOf('.') + 1));

  // Validate it is a .csv file, then show the new fields
  if(fileExtension==="csv"){
    $("#invalid_f").hide();
    $("#finput_txt").html("Uploaded file: <i class='fas fa-file-csv'></i>&nbsp"+fileName);
    $("#after_file").show();
    $("#modal_title").html(`${fileName} (displaying first 250 lines)`);
  }
  else{
    $("#invalid_f").text(`Error: ${fileExtension} is not a supported file type. Please upload a .csv file.`);
    $("#invalid_f").show();
    $("#after_file").hide();
  }
  $("#modal-btn").hide();

  // Listener for the file upload
  var file = document.querySelector('input[type=file]').files[0];  
  reader.addEventListener('error', () => {
    alert(`Error reading ${file.name}.`);
  });    

  reader.addEventListener("load", updateModal, false);
  if (file) {
    reader.readAsText(file);
  }
}

// Store the data in a global variable
var allData=[];

// Process the data and show the graphs
function loadFile() {  
  // Get the sampling frequency from the input box
	let val = $("#sampling_freqency").val();
	var freq=0;
	if(isNumber(val)) freq = parseInt(val);
  if(!isNumber(val) || (freq < 128)){
    alert("Invalid or empty sampling frequency! Please input a valid sampling frequency greater than 128.");
    return;
  }

  // Parse the CSV file
  var data = d3.csvParse(reader.result);
  if(data){
    $("#data_loaded").show();
    $("#file-upload-div").hide();
  
    var columnNames = d3.keys(data[0]);

    let time = $('#time_check').is(":checked")? true: false;

    // Put the raw data into a d3 compatible object
    allData = addTimeData(columnNames, data, freq, time);

    // Update the dropdown with the channel names
    if(time) columnNames.shift();
    updateDropdown(columnNames);

    // Draw the raw data and the FFT
    draw(allData[0], freq);
  }
}

// Generate the HTML for the raw data
function createTable(array) {
  var content = "";
  let numRows = array.length < 250 ? array.length : 250;
    for(let i=0; i<numRows; i++){
    if(i===0){
      content += "<thead class='thead-light'>"
    }
    content += "<tr>";
      for(let j=0; j<array[i].length; j++){
      if(i===0){
        content+=`<th scope='col'>${array[i][j]}</th>`;
      }
      else{
        content += "<td>" + array[i][j] + "</td>" ;
      }
    }
    content += "</tr>";
    if(i===0){
      content += "</thead><tbody>";
    }
  }
  content+="</tbody>"
  return content;
}

// Parse the CSV and put the data into a table within the modal 
function updateModal(){
  var data = d3.csvParseRows(reader.result);

  let content = createTable(data);

  $("#table_content_modal").html(content);
  $("#modal-btn").show();
}

// Dropdown change behavior
$("#dropdown").on("change", function (d) {
    var freq = parseInt($("#sampling_freqency").val());
    console.log(freq);
    // recover the option that has been chosen
    var selectedOption = d3.select("#dropdown").property("value");

    // Remove and then redraw the plot
    d3.select("svg").remove();
    document.getElementById("plot").innerHTML = `<svg width='${graph_width}' height='${graph_height}'></svg>`;

    draw(allData[selectedOption], freq);
});

// Initialize the tooltips
$('[data-toggle="tooltip"]').tooltip();