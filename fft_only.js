// Generate 1 second of sample data
let sampleRate = 512;
let duration = 1;
let amplitudes = [8, 4, 2, 1];
let frequencies = [
	1, // 1 Hz, delta range
	5, // 5 Hz, theta range
	8, // 8 Hz, alpha range
	17 // 17 Hz, beta range
];

let signal = bci.generateSignal(amplitudes, frequencies, sampleRate, duration);

console.log(signal);

// Compute relative power in each frequency band
let bandpowers = bci.bandpower(
	signal,
	sampleRate,
	['delta', 'theta', 'alpha', 'beta'],
	{relative: true}
);

console.log(bandpowers);

doFFT(signal, sampleRate);
drawSignal(signal, "raw_plot");

function doFFT(data, Fs){
	// Set up arrays for real and imaginary components
	let original_len = data.length;
	var real = data;
	var imaginary = new Array(real.length);
	imaginary.fill(0);

	// Calculate the fft
	var fft = new FFT();
	fft.calc(1, real, imaginary);

	let freq = fft.frequencies(real, imaginary, Fs);
	let mag = fft.amplitude(real, imaginary);
	let length = freq.length;

	/*for(let i=0; i<length; i++){
		mag[i]=mag[i]/original_len;
	}*/
	mag = mag.map(x => x/original_len);

	// Create the dataset for the d3 chart
	fftData = [];
	for(let i=0; i<length; i++){
		pt = {
			frequency: freq[i],
			magnitude: mag[i]
		}
		fftData.push(pt);
	}

	// Remove and then redraw the plot
	d3.select("#my_fft_plot").remove();
	//TODO: Don't hard code this in.. Get the HTML
	$("#hi_there").html("<div id = 'my_fft_plot'></div>");
	drawFFT(fftData, "my_fft_plot")

}

function drawSignal(r_data, id){
	var data = [];
	for(let i=0; i<r_data.length; i++){
		pt = {
			magnitude: r_data[i],
			time: i/sampleRate
		}
		data.push(pt);
	}
	console.log(data);

	// set the dimensions and margins of the graph
	var margin = {top: 10, right: 30, bottom: 30, left: 60},
	width = 1200 - margin.left - margin.right,
	height = 550 - margin.top - margin.bottom;

	// append the svg object to the body of the page
	var svg = d3.select("#"+id)
	.append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform",
				"translate(" + margin.left + "," + margin.top + ")");

	// Add X axis --> it is a date format
	var x = d3.scaleLinear()
		.domain(d3.extent(data, function(d) { return d.time; }))
		.range([ 0, width ]);
	svg.append("g")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x));

	// Add Y axis
	var y = d3.scaleLinear()
		.domain(d3.extent(data, function(d) { return d.magnitude; }))
		.range([ height, 0 ]);
	svg.append("g")
		.call(d3.axisLeft(y));

	// Add the line
	svg.append("path")
		.datum(data)
		.attr("fill", "none")
		.attr("stroke", "steelblue")
		.attr("stroke-width", 1.5)
		.attr("d", d3.line()
			.x(function(d) { return x(d.time) })
			.y(function(d) { return y(d.magnitude) })
			)
}


function drawFFT(data, id){
	// set the dimensions and margins of the graph
	var margin3 = {top: 10, right: 30, bottom: 30, left: 60},
	width3 = 1200 - margin3.left - margin3.right,
	height3 = 550 - margin3.top - margin3.bottom;

	// append the svg object to the body of the page
	var svg3 = d3.select("#"+id)
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