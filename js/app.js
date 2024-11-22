const { json, select, selectAll, geoOrthographic, geoPath, geoGraticule } = d3

let geojson, globe, projection, path, graticule, infoPanel, isMouseDown = false, rotation = { x: 0, y: 0 }

// Add scale factor for zoom
let scale = 1

let globeSize = {
    w: window.innerWidth,
    h: window.innerHeight,
}

json('https://assets.codepen.io/911796/custom.geo.json').then(data => init(data))

const init = data => {
    geojson = data
    drawGlobe()
    drawGraticule()
    renderInfoPanel()
    createHoverEffect()
    createDraggingEvents()
    createScrollEvent()
}

const drawGlobe = () => {
    globe = select('body')
        .append('svg')
        .attr('width', globeSize.w)
        .attr('height', globeSize.h)

    projection = geoOrthographic()
        .fitSize([globeSize.w * scale, globeSize.h * scale], geojson)
        .translate([globeSize.w / 2, globeSize.h / 2]) // Centrado inicial

    path = geoPath().projection(projection)

    globe
        .selectAll('path')
        .data(geojson.features)
        .enter().append('path')
        .attr('d', path)
        .style('fill', '#33415c')
        .style('stroke', '#060a0f')
        .attr('class', 'country')
}

const updateGlobe = () => {
    // Actualizar el tamaño del SVG si es necesario
    globe
        .attr('width', globeSize.w)
        .attr('height', globeSize.h)

    // Actualizar proyección con nueva escala y mantener centrado
    const scaledWidth = globeSize.w * scale
    const scaledHeight = globeSize.h * scale

    projection
        .fitSize([scaledWidth, scaledHeight], geojson)
        .translate([globeSize.w / 2, globeSize.h / 2]) // Mantener centrado
        .rotate([rotation.x, rotation.y])

    // Actualizar todos los paths
    selectAll('.country').attr('d', path)
    selectAll('.graticule').attr('d', path(graticule()))
}

const drawGraticule = () => {
    graticule = geoGraticule()

    globe
        .append('path')
        .attr('class', 'graticule')
        .attr('d', path(graticule()))
        .attr('fill', 'none')
        .attr('stroke', '#232323')
}

const renderInfoPanel = () => infoPanel = select('body').append('article').attr('class', 'info')

const createHoverEffect = () => {
    globe
        .selectAll('.country')
        .on('mouseover', function (e, d) {
            const { formal_en, economy } = d.properties
            infoPanel.html(`<h1>${formal_en}</h1><hr><p>${economy}</p>`)
            globe.selectAll('.country').style('fill', '#33415c').style('stroke', '#060a0f')
            select(this).style('fill', '#6ea9ff').style('stroke', 'white')
        })
}

const createDraggingEvents = () => {
    globe
        .on('mousedown', () => isMouseDown = true)
        .on('mouseup', () => isMouseDown = false)
        .on('mousemove', e => {
            if (isMouseDown) {
                const { movementX, movementY } = e
                rotation.x += movementX / 5
                rotation.y += -movementY / 5
                updateGlobe()
            }
        })
}

const createScrollEvent = () => {
    globe.on('wheel', (e) => {
        e.preventDefault() // Prevenir scroll de la página
        
        // Ajustar velocidad de zoom y límites
        const zoomSpeed = 0.1
        const minScale = 0.5
        const maxScale = 2.5

        // Calcular nueva escala basada en la dirección de la rueda
        if (e.deltaY > 0) {
            scale = Math.max(scale - zoomSpeed, minScale)
        } else {
            scale = Math.min(scale + zoomSpeed, maxScale)
        }

        updateGlobe()
    })
}