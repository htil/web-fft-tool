// Set the width and height of the graphs
var graph_width = 800;
var graph_height = 400;

function draw(data, freq) {
  var svg = d3.select("svg"),
    margin = {top: 10, right: 30, bottom: 50, left: 60},
    width = graph_width - margin.left - margin.right,
    height = graph_height - margin.top - margin.bottom;

  // Set up the axis
  var x = d3.scaleLinear().range([0, width]),
    y = d3.scaleLinear().range([height, 0]);

  var xAxis = d3.axisBottom(x),
    yAxis = d3.axisLeft(y);

  // x axis label
  svg.append("text")             
    .attr("transform",
        "translate(" + (width/2) + " ," + 
                        (height + margin.top + 30) + ")")
    .style("text-anchor", "middle")
    .text("Time (s)");

  // y axis label
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

  // The line for the focus (big chart)
  var line = d3
    .line()
    .x(function (d) {
      return x(d.time);
    })
    .y(function (d) {
      return y(d.amplitude);
    });

  // Clip path for the brush
  var clip = svg
    .append("defs")
    .append("svg:clipPath")
    .attr("id", "clip")
    .append("svg:rect")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 0)
    .attr("y", 0);

  // Append the clip path
  var Line_chart = svg
    .append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("clip-path", "url(#clip)");

  // set up the focus
  var focus = svg
    .append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Set the domain for the focus
  x.domain(
    d3.extent(data, function (d) {
      return d.time;
    })
  );
  y.domain(
    [-10*max_signal, 10*max_signal]
  );

  // Call the axis
  focus
    .append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  focus.append("g").attr("class", "axis axis--y").call(yAxis);

  // Call the brush
  focus
    .append("g")
    .attr("class", "brush")
    .call(brush)
    .call(brush.move, x.range());

  // Append the line
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
      //console.log(windowData.length);

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

  fftData = [];
  for(let i=0; i<fft.spectrum.length; i++){
    let pt = {
      frequency: i*Fs/2/fft.spectrum.length,
      magnitude: fft.spectrum[i]
    }
    fftData.push(pt);
  }

  // Remove and then redraw the plot
  d3.select("#fft_plot").remove();
  //TODO: Don't hard code this in.. Get the HTML
  $("#fft_div").html("<div id = 'fft_plot'></div>");

  drawFFT(fftData);
}

// Function to draw the FFT from the generated signal
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

  // Add X axis
  var x_fft = d3.scaleLinear()
    .domain(d3.extent(data_fft, function(d) { return d.frequency; }))
    .range([ 0, width_fft ]);
  var xAxis_fft=svg_fft.append("g")
    .attr("transform", "translate(0," + height_fft + ")")
    .call(d3.axisBottom(x_fft));

  // Add Y axis
  var y_fft = d3.scaleLinear()
    .domain(d3.extent(data_fft, function(d) { return d.magnitude; }))
    .range([ height_fft, 0 ]);
  var yAxis_fft=svg_fft.append("g")
    .call(d3.axisLeft(y_fft));

  // fft x-axis label
  svg_fft.append("text")             
    .attr("transform",
        "translate(" + (width_fft/2) + " ," + 
                        (height_fft + margin_fft.top + 25) + ")")
    .style("text-anchor", "middle")
    .text("Frequency (Hz)");

  // fft y-axis label
  svg_fft.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin_fft.left)
    .attr("x",0 - (height_fft / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Magnitude");  

  //// Add a clipPath: everything out of this area won't be drawn.
  var fft_clip = svg_fft.append("defs").append("svg:clipPath")
    .attr("id", "clip_fft")
    .append("svg:rect")
    .attr("width", width_fft )
    .attr("height", height_fft )
    .attr("x", 0)
    .attr("y", 0);

  // Add brushing
  var brush_fft = d3.brushX()                  
  .extent( [ [0,0], [width_fft,height_fft] ] ) 
  .on("end", updateChart)         

  // Create the line variable: where both the line and the brush take place
  var line_fft = svg_fft.append('g')
  .attr("clip-path", "url(#clip_fft)")

  // Add the line
  line_fft.append("path")
    .datum(data_fft)
    .attr("class", "line") 
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
    .x(function(d) { return x_fft(d.frequency) })
    .y(function(d) { return y_fft(d.magnitude) })
    )

  line_fft
  .append("g")
    .attr("class", "brush")
    .call(brush_fft);

  // A function that set idleTimeOut to null
  var idleTimeout
  function idled() { idleTimeout = null; }

  // A function that update the chart for given boundaries
  function updateChart() {

    // What are the selected boundaries?
    extent = d3.event.selection

    // If no selection, back to initial coordinate. Otherwise, update X axis domain
    if(!extent){
      if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
      x_fft.domain([ 4,8])
    }else{
      x_fft.domain([ x_fft.invert(extent[0]), x_fft.invert(extent[1]) ])
      line_fft.select(".brush").call(brush_fft.move, null)
    }

    // Update axis and line position
    xAxis_fft.transition().duration(1000).call(d3.axisBottom(x_fft))
    line_fft
      .select('.line')
      .transition()
      .duration(1000)
      .attr("d", d3.line()
      .x(function(d) { return x_fft(d.frequency) })
      .y(function(d) { return y_fft(d.magnitude) })
      )
  
  }

  // Reset on double click
  svg_fft.on("dblclick",function(){
    x_fft.domain(d3.extent(data_fft, function(d) { return d.frequency; }))
    xAxis_fft.transition().call(d3.axisBottom(x_fft))
    line_fft
      .select('.line')
      .transition()
      .attr("d", d3.line()
        .x(function(d) { return x_fft(d.frequency) })
        .y(function(d) { return y_fft(d.magnitude) })
    )
  });
}

// Helper functions for extracting data from the moving window
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

// Convert raw signal into data that D3 can process
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

// Function to plot the generated signal and the FFT
function drawWave(){
  let sampleRate = parseFloat($("#sampleRateInput").val());
  let duration = parseInt($("#signalDurationInput").val());

  var amp = $('.amp_value').map((_,el) => el.value).get();
  var freq = $('.freq_value').map((_,el) => el.value).get();

  //let signal = bci.generateSignal(amp, freq, sampleRate, duration);
  let type = getWaveformType($("#waveform_type").val());
  let osc = new Oscillator(type, freq[0], amp[0], sampleRate*duration, sampleRate);
  osc.generate();
  for(let i=1; i<amp.length; i++){
    let osc2 = new Oscillator(type, freq[i], amp[i], sampleRate*duration, sampleRate);
    osc2.generate();
    osc.addSignal(osc2.signal);
  }
  signal = osc.signal;

  var gen = convertToD3Data(signal, sampleRate);
  d3.select("svg").remove();
  //TODO: Don't hard code this in.. Get the HTML
  document.getElementById("plot").innerHTML = `<svg width='${graph_width}' height='${graph_height}'></svg>`;

  draw(gen, sampleRate);
}

function getWaveformType(wave){
  let type=0;
  if(wave==="sine"){
    type=DSP.SINE;
  }
  else if(wave==="triangle"){
    type=DSP.TRIANGLE;
  }
  else if(wave==="saw"){
    type=DSP.SAW;
  }
  else{
    type=DSP.SQUARE;
  }
  return type;
}

// Variables needed for adding signals
var regex = /^(.+?)(\d+)$/i;
var cloneIndex = $(".clonedInput").length+1;
var max_signal = 5;  // The max number of signals that can be added

// Function to add a new signal by cloning the first one
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
            // Regex to change the ids
            var id = this.id || "";
            var match = id.match(regex) || [];
            if (match.length == 3) {
                this.id = match[1] + (cloneIndex);
            }
        })
        .on('click', 'button.remove', remove)
    cloneIndex++;
}

// Function to remove the signal
function remove(){
    if($(this).attr('id') === "removeButton1") return;
    $(this).parents(".clonedInput").remove();
    drawWave();
}

// Event handlers for add signal and remove
$("button.clone").on("click", add_signal);
$("button.remove").on("click", remove);

// Function to add a new signal
function add_signal(){
  if($(".clonedInput").length == max_signal) return;
  clone();
  drawWave();
}

// Input validation for advanced options
$('#advanced_options').on('change', 'input.signal_control', function() {
  if(parseInt($(this).val()) > parseInt($(this).attr('max'))){
    $("#signal_gen_alert").show();
    $("#signal_gen_alert").text(`Current value ${$(this).val()} exceeds the maximum of ${$(this).attr('max')}`);
  }
  else if(parseInt($(this).val()) < parseInt($(this).attr('min'))){
    $("#signal_gen_alert").show();
    $("#signal_gen_alert").text(`Current value ${$(this).val()} is below the minimum of ${$(this).attr('min')}`);
  }
	else if(!isNumber($(this).val())){
		$("#signal_gen_alert").show();
    $("#signal_gen_alert").text(`Current value ${$(this).val()} is not a valid number`);
	}
  else{
    $("#signal_gen_alert").hide();
		drawWave();
  }
});

// Logic for toggling advanced options (reset the max freq)
function toggle_advanced(){
  if($('#adv_opt_check').is(":checked")){
    $('#advanced_options').show(); 
    $(".freq").attr("max", 511);
  }
  else{
    $('#advanced_options').hide(); 
    $(".freq").attr("max", 255);
    $('.freq').each(function(i, obj) {
      if($(this).val() > 255) $(this).val(255);
    });
    $("#sampleRateInput").val(512);
    $("#sampleRateRange").val(512);
    $("#signalDurationInput").val(1);
    $("#waveform_type").val("sine");
    $("#signal_gen_alert").hide();
    drawWave();
  }
}
$('#adv_opt_check')[0].checked=false;
drawWave();



