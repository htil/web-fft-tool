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

// Compute relative power in each frequency band
let bandpowers = bci.bandpower(
	signal,
	sampleRate,
	['delta', 'theta', 'alpha', 'beta'],
	{relative: true}
);

console.log(bandpowers);

doFFT(signal);

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
	for(let i=0; i<real.length/2;i++){
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
	//console.log(fftData);

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