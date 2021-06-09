function getChannelData(channel, data)
{
  // Sampling Rate
  const freq = 512; // Hz

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

function getEEGData(channelNames, data)
{
    let d = [];
    for(let i=0; i<channelNames.length; i++)
    {
        let channelData = getChannelData(channelNames[i], data);
        //console.log(channelNames[i]);
        //console.log(channelData);
        d.push({channel: channelNames[i],
                value: channelData,
        });
    }
    return d;
};

function draw(d, id){
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

  // Add a clipPath: everything out of this area won't be drawn.
  var clip = svg.append("defs").append("svg:clipPath")
    .attr("id", "clip")
    .append("svg:rect")
    .attr("width", width )
    .attr("height", height )
    .attr("x", 0)
    .attr("y", 0);

  // Add brushing
  var brush = d3.brushX()                  
    .extent( [ [0,0], [width,height] ] )  
    .on("end", updateChart)             

  // Create the line variable for the line and the brush
  var line = svg.append('g')
    .attr("clip-path", "url(#clip)")

  // Add the line
  line.append("path")
    .datum(data)
    .attr("class", "line")  // I add the class line to be able to modify this line later on.
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
      .x(function(d) { return x(d.time) })
      .y(function(d) { return y(d.amplitude) })
      )

  // Add the brushing
  line
    .append("g")
      .attr("class", "brush")
      .call(brush);

  // A function that set idleTimeOut to null
  var idleTimeout
  function idled() { idleTimeout = null; }

  // A function that update the chart for given boundaries
  function updateChart() {

    // Get selected area
    extent = d3.event.selection

    // If no selection, reset view. Otherwise, update X axis domain
    if(!extent){
      if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
      x.domain([ 4,8])
    }else{
      x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
      line.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
    }

    // Update axis and line position
    xAxis.transition().duration(1000).call(d3.axisBottom(x))
    line
        .select('.line')
        .transition()
        .duration(1000)
        .attr("d", d3.line()
          .x(function(d) { return x(d.time) })
          .y(function(d) { return y(d.amplitude) })
        )
  }

  // Reset on double click
  svg.on("dblclick",function(){
    x.domain(d3.extent(data, function(d) { return d.time; }))
    xAxis.transition().call(d3.axisBottom(x))
    line
      .select('.line')
      .transition()
      .attr("d", d3.line()
        .x(function(d) { return x(d.time) })
        .y(function(d) { return y(d.amplitude) })
    )
  });
  
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


function drawRawFromFile(file, id)
{
  d3.csv(file, 
    function(data) {

      // Parse out channel names
      var channelNames = d3.keys(data[0]);

      // Update the dropdown with the channel names
      updateDropdown(channelNames)

      // Get the EEG Data from the .csv file
      var allData = getEEGData(channelNames, data);

      // Plot the first channel's data
      draw(allData[0], id);
      
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

drawRawFromFile("A114_raw_512HZ.csv", "line_plot1");