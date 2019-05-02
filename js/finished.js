'use strict';

(function () {

  let data = "no data";
  let svgContainer = ""; // keep SVG reference in global scope
  let yearSelected = 1960;

  // load data and make scatter plot after window loads
  window.onload = function () {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 500)
      .attr('height', 500);

    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("./data/prepped_data.csv")
      .then((data) => basicPlot(data));
  }

  // make scatter plot with trend line
  function basicPlot(csvData) {
    data = csvData;

    // get arrays of fertility rate data, time  and life Expectancy data
    let fertility_rate_data = data.map((row) => parseFloat(row["fertility_rate"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));
    let time_data = data.map((row) => parseFloat(row["time"])).filter(distinct);


    // find data limits
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);
    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits,"fertility_rate", "life_expectancy");

    // user input drop down list for selecting year
    dropDownYear(time_data, mapFunctions);

    // draw title and axes labels
    makeLabels();
  }

  function makeScatterPlot(year, mapFunctions) {
    let filteredData = data.filter(function (column) {
        if (column["time"] == year) { return column; }
    });
    // plot data as points and add tooltip functionality
    plotData(mapFunctions, filteredData);
  }

  function distinct(value, index, self) {
    return self.indexOf(value) === index;
  }

  function dropDownYear(time_data, mapFunctions) {
    let dropdown = d3.select("body").append("select")
      .attr("name", "years")

    let showYear = svgContainer.append('text')
      .attr('x', 400)
      .attr('y', 80)
      .style('font-size', '20pt')
      .text(yearSelected);

    var options = dropdown.selectAll("option")
      .data(time_data)
      .enter()
      .append("option");
    options.text(function (d) { return d; })
      .attr("value", function (d) { return d; });
    
    makeScatterPlot(yearSelected, mapFunctions);

    dropdown.on("change", function () {
      yearSelected = this.value;
      showYear.selectAll("text").remove();
      showYear.text(yearSelected);
      svgContainer.selectAll("circle").remove();
      makeScatterPlot(yearSelected, mapFunctions);
    });
    
  }



  // make title and axes labels
  function makeLabels() {
    svgContainer.append('text')
      .attr('x', 80)
      .attr('y', 40)
      .style('font-size', '14pt')
      .text("World Life Expectancy and Fertility Rate Through Time");

    svgContainer.append('text')
      .attr('x', 130)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Fertility Rates (Avg Children per Woman)');

    svgContainer.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Life Expectancy (Years)');
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map, fData) {

    // get population data as array
    let pop_data = fData.map((row) => +row["pop_mlns"]);
    let pop_limits = d3.extent(pop_data);

    // make size scaling function for population
    let pop_map_func = d3.scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([0, 50]);

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // make tooltip
    let div = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    // append data to SVG and plot as points
    svgContainer.selectAll('.dot')
      .data(fData)
      .enter()
      .append('circle')
      .attr('cx', xMap)
      .attr('cy', yMap)
      .attr('r', (d) => pop_map_func(d["pop_mlns"]))
      .attr('fill', "#4286f2")
      // add tooltip functionality to points
      .on("mouseover", (d) => {
        div.transition()
          .duration(200)
          .style("opacity", .9);
        div.html(d.location + "<br/>" + numberWithCommas(d["pop_mlns"] * 1000000))
          .style("left", (xMap) + "px")
          .style("top", (yMap) + "px");
      })
      .on("mouseout", (d) => {
        div.transition()
          .duration(500)
          .style("opacity", 0);
      });
  }

  // draw the axes and ticks
  function drawAxes(limits, x, y) {
    // return x value from a row of data
    let xValue = function (d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
      .range([50, 450]);

    // xMap returns a scaled x value from a row of data
    let xMap = function (d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svgContainer.append("g")
      .attr('transform', 'translate(0, 450)')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function (d) { return +d[y] }

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
      .range([50, 450]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin: xMin,
      xMax: xMax,
      yMin: yMin,
      yMax: yMax
    }
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

})();
