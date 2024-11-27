document.addEventListener('DOMContentLoaded', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    let projectionFront, projectionBack, pathFront, pathBack, svg, globe, graticule;
    let connections = [];
    let selectedCountries = [];
    let rotation = [0, 0]; // Initial rotation

    // Create SVG and projections
    svg = d3.select("body")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    projectionFront = d3.geoOrthographic()
        .scale(height / 2.3)
        .translate([width / 2, height / 2])
        .rotate(rotation)
        .clipAngle(90);

    projectionBack = d3.geoOrthographic()
        .scale(height / 2.3)
        .translate([width / 2, height / 2])
        .rotate(rotation)
        .clipAngle(180);

    pathFront = d3.geoPath(projectionFront);
    pathBack = d3.geoPath(projectionBack);

    // Main globe group
    globe = svg.append("g");

    // Define the graticule
    graticule = d3.geoGraticule();

    // Load and draw countries
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
        .then(worldData => {
            const countries = topojson.feature(worldData, worldData.objects.countries);

            // BACK-FACING COUNTRIES
            globe.append("g")
                .selectAll(".country-back")
                .data(countries.features)
                .enter()
                .append("path")
                .attr("d", pathBack)
                .attr("class", "country-back")
                .attr("fill", "#555") // Different color for back side
                .attr("stroke", "#aaa")
                .attr("opacity", .3)
                .attr("stroke-width", 0.5);
                
            // Append graticule path for back hemisphere
            globe.append("path")
            .datum(graticule())
            .attr("fill", "none")
            .attr("stroke", "#555")
            .attr("stroke-width", 0.2)
            .attr("d", pathBack)
            .attr("class", "graticule-back");

            // FRONT-FACING COUNTRIES
            globe.append("g")
                .selectAll(".country-front")
                .data(countries.features)
                .enter()
                .append("path")
                .attr("d", pathFront)
                .attr("class", "country-front")
                .attr("fill", "#000")
                .attr("stroke", "#ddd")
                .attr("stroke-width", 0.5)
                .on("mouseover", handleMouseOver)
                .on("mouseout", handleMouseOut)
                .on("click", handleCountryClick);

            // Append graticule path AFTER countries for front hemisphere
            globe.append("path")
                .datum(graticule())
                .attr("fill", "none")
                .attr("stroke", "#555")
                .attr("stroke-width", 0.5)
                .attr("d", pathFront)
                .attr("class", "graticule-front");

        });

    const zoom = d3.zoom()
        .scaleExtent([0.5, 5]) // Set zoom scale limits
        .on("zoom", (event) => {
            const transform = event.transform;

            // Adjust projection scale based on zoom
            projectionFront.scale((height / 2.3) * transform.k);
            projectionBack.scale((height / 2.3) * transform.k);

            if (event.sourceEvent) { // Check for drag events
                const sensitivity = 0.25; // Control rotation sensitivity
                rotation[0] += event.sourceEvent.movementX * sensitivity;
                rotation[1] -= event.sourceEvent.movementY * sensitivity;
                projectionFront.rotate(rotation);
                projectionBack.rotate(rotation);
            }

            // Redraw all paths
            globe.selectAll(".country-back").attr("d", pathBack);
            globe.selectAll(".country-front").attr("d", pathFront);

            // Redraw graticules
            globe.selectAll(".graticule-front").attr("d", pathFront);
            globe.selectAll(".graticule-back").attr("d", pathBack);

            // Redraw connections
            drawConnections();
        });

    // Attach zoom behavior to the SVG
    svg.call(zoom);

    // Draw connections
    const drawConnections = () => {
        globe.selectAll(".connection").remove();

        connections.forEach(({ source, target }) => {
            const arc = d3.geoInterpolate(source, target);
            const points = d3.range(0, 1.01, 0.02).map(arc);

            globe.append("path")
                .datum({ type: "LineString", coordinates: points })
                .attr("d", pathFront)
                .attr("fill", "none")
                .attr("stroke", "#e74c3c")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "5,5")
                .attr("class", "connection");
        });
    };

    // Handle mouse events
    const handleMouseOver = (event, d) => {
        d3.select(event.target)
            .attr("fill", "#3498db");
    };

    const handleMouseOut = (event) => {
        d3.select(event.target)
            .attr("fill", "#000");
    };

    const handleCountryClick = (event, d) => {
        const country = d;

        if (selectedCountries.includes(country)) {
            selectedCountries = selectedCountries.filter(c => c !== country);
            d3.select(event.target).attr("fill", "#000");
        } else {
            selectedCountries.push(country);
            d3.select(event.target).attr("fill", "#2ecc71");
        }

        if (selectedCountries.length === 2) {
            const [source, target] = selectedCountries;
            connections.push({
                source: d3.geoCentroid(source),
                target: d3.geoCentroid(target)
            });
            selectedCountries = [];
            drawConnections();
        }
    };

    // Rotate globe on drag
    svg.call(
        d3.drag()
            .on("drag", (event) => {
                const sensitivity = 0.25; // Control rotation speed
                const dx = event.dx * sensitivity;
                const dy = event.dy * sensitivity;

                rotation[0] += dx;
                rotation[1] -= dy;

                projectionFront.rotate(rotation);
                projectionBack.rotate(rotation);

                globe.selectAll(".country-back").attr("d", pathBack);
                globe.selectAll(".country-front").attr("d", pathFront);

                // Update graticules
                globe.selectAll(".graticule-front").attr("d", pathFront);
                globe.selectAll(".graticule-back").attr("d", pathBack);

                drawConnections();
            })
    );

    // Resize handler
    window.addEventListener("resize", () => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;

        svg.attr("width", newWidth).attr("height", newHeight);
        projectionFront
            .scale(newHeight / 2.3)
            .translate([newWidth / 2, newHeight / 2]);

        projectionBack
            .scale(newHeight / 2.3)
            .translate([newWidth / 2, newHeight / 2]);

        globe.selectAll(".country-back").attr("d", pathBack);
        globe.selectAll(".country-front").attr("d", pathFront);
        drawConnections();
    });
});