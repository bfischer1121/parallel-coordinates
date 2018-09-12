// brush mode: indicators

(function() {
	var brushes = {};

	function is_brushed(p) {
		return !brushes[p].empty();
	}

  // data within extents
  function selected() {
    return __.getFilteredDimensions(__.data);
  }

  function brushExtents(extents) {
    if(typeof(extents) === 'undefined')
		{
			var extents = {};
			d3.keys(__.dimensions).forEach(function(d) {
				var brush = brushes[d];
				if (brush !== undefined && !brush.empty()) {
					var extent = brush.extent();
					extent.sort(d3.ascending);
					extents[d] = extent;
				}
			});
			return extents;
		}
		else
		{
			//first get all the brush selections
			var brushSelections = {};
			g.selectAll('.brush')
				.each(function(d) {
					brushSelections[d] = d3.select(this);
			  });

			// loop over each dimension and update appropriately (if it was passed in through extents)
			d3.keys(__.dimensions).forEach(function(d) {
				if (extents[d] === undefined){
					return;
				}

				var brush = brushes[d];

				if (brush !== undefined) {
					//update the extent
					brush.extent(extents[d]);

					//redraw the brush
					brushSelections[d]
						.transition()
						.duration(0)
						.call(brush);

					//fire some events
					brush.event(brushSelections[d]);
				}
			});

			//redraw the chart
			pc.renderBrushed();

			return pc;
		}
  }

  function brushFor(axis) {
    var brush = d3.svg.brush();

    brush
      .y(__.dimensions[axis].yscale)
      .on("brushstart", function() {
				if(d3.event.sourceEvent !== null) {
					events.brushstart.call(pc, __.brushed);
					d3.event.sourceEvent.stopPropagation();
				}
			})
			.on("brush", function() {
        __.onBrush();
				brushUpdated(selected());
			})
			.on("brushend", function() {
				events.brushend.call(pc, __.brushed);
			});

		brushes[axis] = brush;
		return brush;
	};

	function brushReset(dimension) {
		if (dimension===undefined) {
			__.brushed = false;
			if (g) {
				g.selectAll('.brush')
					.each(function(d) {
						d3.select(this)
							.transition()
							.duration(0)
							.call(brushes[d].clear());
					});
				pc.renderBrushed();
			}
		}
		else {
			if (g) {
				g.selectAll('.brush')
					.each(function(d) {
						if (d!=dimension) return;
						d3.select(this)
							.transition()
							.duration(0)
							.call(brushes[d].clear());
						brushes[d].event(d3.select(this));
					});
				pc.renderBrushed();
			}
		}
		return this;
	};

	function install() {
		if (!g) pc.createAxes();

		// Add and store a brush for each axis.
		var brush = g.append("svg:g")
			.attr("class", "brush")
			.each(function(d) {
				d3.select(this).call(brushFor(d));
			});

		brush.selectAll("rect")
				.style("visibility", null)
				.attr("x", -15)
				.attr("width", 30);

		brush.selectAll("rect.background")
				.style("fill", "transparent");

		brush.selectAll("rect.extent")
				.style("fill", "rgba(255,255,255,0.25)")
				.style("stroke", "rgba(0,0,0,0.6)");

		brush.selectAll(".resize rect")
				.style("fill", "rgba(0,0,0,0.1)");

		pc.brushExtents = brushExtents;
		pc.brushReset = brushReset;
		return pc;
	};

	brush.modes["indicators"] = {
		install: install,
		uninstall: function() {
			g.selectAll(".brush").remove();
			brushes = {};
			delete pc.brushExtents;
			delete pc.brushReset;
		},
		selected: selected,
		brushState: brushExtents
	}
})();
