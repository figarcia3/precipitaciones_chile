const WIDTH = 800,
      HEIGHT = WIDTH * 0.4;

const WIDTH_MAP = 200,
      HEIGHT_MAP = HEIGHT+10;

const margin = { top: 80, bottom: 70, left: 80, right: 50 };

const margin_map = { top: 0, bottom: 0, left: 0, right: 0 };

const width = WIDTH - margin.left - margin.right,
      height = HEIGHT - margin.top - margin.bottom;

const width_map = WIDTH_MAP - margin_map.left - margin_map.right,
      height_map = HEIGHT_MAP - margin_map.top - margin_map.bottom;


const svg = d3.select(".contenedor")
                .append("svg")
                .attr("width", WIDTH)
                .attr("height", HEIGHT);

const svg_map = d3.select('svg#earthquakes-svg')
                    .attr("width", WIDTH_MAP)
                    .attr("height", HEIGHT_MAP);

const map = svg_map
                .append("g")
                .attr('id', 'geo-container')
                .attr('transform', `translate(${margin_map.left}, ${margin_map.top})`);

const chile = map.append("g").attr("id", "continents")
const coordenadasEstaciones = map.append("g").attr("id", "estaciones")

const g = svg.append("g")
             .attr('transform', `translate(${margin.left}, ${margin.top})`);

const xAxis = svg.append("g")
                    .attr('transform', `translate(${margin.left}, ${margin.top + height + 10})`)

const yAxis = svg.append("g")
                    .attr('transform', `translate(${margin.left}, ${margin.top})`)

const xLabel = svg.append("text")
                    .attr('transform', `translate(${margin.left + width / 2}, ${HEIGHT - margin.bottom / 2})`)
                    .attr('dy', '0.5em')
                    .style('text-anchor', 'middle')
                    .style("font-size", "15px")
                    .text("Fecha (yyyy-mm)")

const yLabel = svg.append("text")
                    .attr('transform', `rotate(-90) translate(${- (margin.top + height / 2)}, ${margin.left / 2})`)
                    .attr('dy', '-0.5em')
                    .style('text-anchor', 'middle')
                    .style("font-size", "12px")
                    .text("Precipitaciones (mm./m^2)")

const title = svg.append("text")
                    .attr('transform', `translate(${margin.left + width / 2}, ${margin.top / 2})`)
                    .attr('dy', '0.5em')
                    .style('text-anchor', 'middle')
                    .text("Precipitaciones (mm./m^2) vs Tiempo (yyyy-mm)")


const colors = ["#FF8966", "#8AE1FC", 
                "#947BD3", "#F7EE7F", 
                "#F896D8", "#00635D", 
                "#08A4BD", "#db9c9f",
                "#99aadd", "#ff6800",
                "#c9a287", "#75ea9c",
                "#e57c5c", "#ff00db",
                "#7dd47f", "#ffaf6e",
                "#ffbdd8", "#ff0040",
                "#85c3de", "#ffd878",
                "#67dde0", "#ff6900",
                "#bf9171", "##ffaf00",
                "#00a4ff", "#c24aab",
                "#85c3de", "#a4ffbe"];

// tooltip puntos.
const tooltipG = svg.append('g')
                .attr("display", "none");

// tooltipG.append("rect")
//                 .attr("x", 0)
//                 .attr("y", 0)
//                 .attr("width", 80)
//                 .attr("height", 50)
//                 .attr("rx", 20)
//                 .style("fill", "lightgray")
//                 .style("stroke", "black")
//                 .style("border-radius", "5%")

const tooltipText = tooltipG.append("text")
                .attr("y", -20)
                .style("fill", "black")

const tooltipTextX = tooltipText.append("tspan")
                .attr("x", 0)
                .style("text-anchor", "middle"),
tooltipTextY = tooltipText.append("tspan")
                .attr("x", 0)
                .style("text-anchor", "middle")
                .attr("dy", "1.2em");
    
// tooltipMapa

const tooltipG_map = svg_map.append('g')
                .attr("display", "none");

const tooltipText_map = tooltipG_map.append("text")
                .attr("y", -2)
                .style("fill", "black")

const tooltipTextX_map = tooltipText_map.append("tspan")
                .attr("x", 0)
                .style("text-anchor", "middle"),

tooltipTextY_map = tooltipTextX_map.append("tspan")
                .attr("x", 50)
                .style("text-anchor", "middle")
                .attr("dy", "1.2em");

const fechaFormat = d3.timeParse("%Y-%m")

const svg_seleccionados = d3.select(".seleccionados")
const seleccionados = svg_seleccionados.append('g').attr("class", "seleccionado")

let datosProcess = {};
let dataEstaciones;

const generarGrafico = (datos, stations) => {

    let data = []

    for(key of stations){
        data.push(datos[key])
    }


    let datosPlanos = [];
    // obtenemos los Rangos de las precipitaciones de data
    let Ymax = 100;
    let Ymin = 0;

    // obtenemos el rango de los años, como son todos los mismo, solo basta agarrar un arreglo
    let Xrange = [0];

    if (!data.length == 0){
        datosPlanos = data.reduce((cur, acc) => [...cur, ...acc.precipitaciones], []);
        // obtenemos los Rangos de las precipitaciones de data
        Ymax = d3.max(data.map((d) => d3.max(d["precipitaciones"].map((e) => e["valor"]))));
        Ymin = d3.min(data.map((d) => d3.min(d["precipitaciones"].map((e) => e["valor"]))));
    
        // obtenemos el rango de los años, como son todos los mismo, solo basta agarrar un arreglo
        Xrange = data[0]["precipitaciones"].map((d) => fechaFormat(d["fecha"]));
    }


    // Creamos las escalas para los ejes.
    const escalaY = d3
        .scaleLinear()
        .domain([Ymin, Ymax])
        .range([height, 0]);


    const escalaX = d3
        .scaleTime()
        .domain(d3.extent(Xrange))
        .range([0, width]);

    // Generamos los ejes.
    xAxis.transition().duration(1000).call(d3.axisBottom(escalaX).ticks(d3.timeMonth.every(3)).tickFormat(d3.timeFormat("%Y-%m")));
    yAxis.transition().duration(1000).call(d3.axisLeft(escalaY).ticks(10));
    
    // Definimos la línea.
    const linea = d3
        .line()
        .x( d => escalaX(fechaFormat(d.fecha)))
        .y( d => escalaY(d.valor))
        .curve(d3.curveMonotoneX);
    
    const lineaZero = d3
        .line()
        .x( d => escalaX(fechaFormat(d.fecha)))
        .y( d => escalaY(0))
        .curve(d3.curveMonotoneX);

    // Definimos los simbolos
    const simbolo = d3.symbol().size(4*2);

    // Seteamos las lineas en la visualización.
    g
        .selectAll(".linea")
        .data(data)
        .join(
            (enter) => {
                enter
                    .append("path")
                    .attr("class", "linea")
                    .attr("d", d => lineaZero(d.precipitaciones))
                    .transition()
                    .duration(1000)
                    .attr("d", d => linea(d.precipitaciones))
                    .attr("fill", "transparent")
                    .attr("stroke", (d, i) => d.color);

            },
            (update) => {
                update
                    .transition()
                    .duration(1000)
                    .attr("d", d => linea(d.precipitaciones))
                    .attr("stroke", (d, i) => d.color);
            },
            (exit) => {
                exit
                    .transition()
                    .duration(1000)
                    .attr("d",  d => lineaZero(d.precipitaciones))
                    .remove();
            }
        )
    
    // Seteamos los puntos en la visualización
    g
        .selectAll(".simbolo")
        .data(datosPlanos)
        .join(
            (enter) => {
                enter
                    .append("path")
                    .attr("class", "simbolo")
                    .attr("d", simbolo())
                    .attr("fill", "black")
                    .attr("transform", (d) => `translate(${escalaX(fechaFormat(d.fecha))}, ${escalaY(0)})`)
                    .on("mouseover", (_, d) => {
                        tooltipTextX.text(`X: ${d.fecha}`)
                        tooltipTextY.text(`Y: ${d.valor}`)
                        tooltipG.attr("display", true)
                            .attr('transform', `translate(${margin.left + escalaX(fechaFormat(d.fecha)) + 2}, ${margin.top + escalaY(d.valor) + 2})`)
                    })
                    .on("mouseleave", () => {
                        tooltipG.attr("display", "none");
                    })
                    .transition()
                    .duration(1000)
                    .attr("transform", (d) => `translate(${escalaX(fechaFormat(d.fecha))}, ${escalaY(d.valor)})`)
            },
            (update) => {
                update
                    .on("mouseover", (_, d) => {
                        tooltipTextX.text(`X: ${d.fecha}`)
                        tooltipTextY.text(`Y: ${d.valor}`)
                        tooltipG.attr("display", true)
                            .attr('transform', `translate(${margin.left + escalaX(fechaFormat(d.fecha)) + 2}, ${margin.top + escalaY(d.valor) + 2})`)
                    })
                    .on("mouseleave", () => {
                        tooltipG.attr("display", "none")
                    })
                    .transition()
                    .duration(1000)
                    .attr("transform", (d) => `translate(${escalaX(fechaFormat(d.fecha))}, ${escalaY(d.valor)})`)
            },
            (exit) => {
                exit
                    .transition()
                    .duration(1000)
                    .attr("opacity", 0)
                    .remove();
            }
            
        )
    
    seleccionados
            .selectAll("svg")
            .data(data)
            .join(
                (enter) => {
                    enter
                        .append("svg")
                        .attr("class", "seleccionadoestacion")
                        .style("background-color", (d) => d.color)
                        .attr("width", 20)
                        .attr("height", 20)
                        .attr("opacity", 1)
                        .on("click", (_, d) => {
                            d3.selectAll(".circle")
                                .attr("stroke", "transparent")
                                .attr("r", 2)
                                .attr("opacity", 0.5)
                            d3.select('#selector').property('value', d.codigo_estacion)
                            d3.select('#c'+d.codigo_estacion)
                                .attr("r", 6)
                                .attr("stroke", "black")
                                .attr("opacity", 1)
                        })
                },
                (update) => {
                    update
                    .style("background-color", (d) => d.color)
                },
                (exit) => {
                    exit
                        .remove();
                }
            )
    
    seleccionados
            .selectAll("text")
            .data(data)
            .join(
                (enter) => {
                    enter
                        .append("text")
                        .attr("class", "text")
                        .text((d) => d.nombre)
                        .style("font-size", "12px")
                },
                (update) => {
                    update
                        .text((d) => d.nombre)
                },
                (exit) => {
                    exit
                        .remove();
                }
            )
    
    

};

const contenedorSelectores = d3
                                .select(".selectores");


const selectorTexto = contenedorSelectores
    .append("text")
    .text("Seleciona la estación que desees.")

const selector = contenedorSelectores
    .append("select")
    .attr("id", "selector")
    .attr("class", "selector");

const btnAgregar = contenedorSelectores
    .append("button")
    .attr("class", "selector")
    .text("Agregar");

const btnQuitar = contenedorSelectores
    .append("button")
    .attr("class", "selector")
    .text("Quitar");

const contenedorSeleccionados = d3
    .select(".seleccionados");

function ticket(d, array) {
    if (array.includes(d)){
        return ("✔️"+datosProcess[d].nombre);
    }
    else{
        return datosProcess[d].nombre;
    }
}

const clipPath = map.append("clipPath")
                    .attr("id", "mapClip")
                    .append("rect")
                        .attr("width", width_map)
                        .attr("height", height_map)

map.attr("clip-path", "url(#mapClip)")

const zoomHandler = (evento) => {

    const transformacion = evento.transform

    const duration = 100;

    chile
        .selectAll(".continent")
        .transition()
        .duration(duration)
        .attr("transform", transformacion);
    
    coordenadasEstaciones
        .selectAll(".circle")
        .transition()
        .duration(duration)
        .attr("transform", transformacion);
    
    tooltipText_map
        .selectAll(".text")
        .transition()
        .duration(duration)
        .attr("transform", transformacion);
}


const zoom = d3
                .zoom()
                .extent([[0,0],[width_map, height_map],])
                .translateExtent([[0,0],[width_map, height_map],])
                .scaleExtent([1,4])
                .on("zoom", zoomHandler);

svg_map.call(zoom);


d3.json("./data/estaciones.json")
    .then( (datos) => {


        // Les pasamos el valor del color correspondiente a cada estacion.

        for(d in datos){
            datos[d]["color"] = colors[d]
        }

        // Diccionario donde key: nombre, value: todos los datos de la estacion.    
        dataEstaciones = datos;
        // Hacemos un array con todas las key nombre
        let selectorOptions = []

        // Estaciones Selecionadas
        let selectedStations = []

        for(d of datos){
            datosProcess[d.codigo_estacion] = d;
            selectorOptions.push(d.codigo_estacion);
        };


        selector
            .selectAll("option")
            .data(selectorOptions)
            .join("option")
            .attr("value", (d) => d)
            .text((d) => datosProcess[d].nombre)
        
        generarGrafico(datosProcess, selectedStations);

        btnAgregar
            .on("click", (e) => {

                // Obtenemos el valor del selector
                const valorActual = selector.node().value;
                if (!selectedStations.includes(valorActual) && selectedStations.length < 5){
                    selectedStations.push(valorActual);
                    generarGrafico(datosProcess, selectedStations);

                    // Corremos la selección para agregar el check.
                    selector
                        .selectAll("option")
                        .data(selectorOptions)
                        .join("option")
                        .attr("value", (d) => d)
                        .text((d) => ticket(d, selectedStations));

                    // Agregamos svg con el texto.                
                    if (selectedStations.length == 5){
                        selectorTexto
                            .text("Alcanzaste el máximo de selección")
                    }else{
                        selectorTexto
                            .text("Llevas "+selectedStations.length+" estacion(es) seleccionada(s).")
                    }
                }
            })
        
        btnQuitar
            .on("click", (e) => {

                // Obtenemos el valor del selector
                const valorActual = selector.node().value;
                let index = selectedStations.indexOf(valorActual);
                if (index > -1){
                    selectedStations.splice(index, 1);
                    generarGrafico(datosProcess, selectedStations);

                    // Corremos la selección para agregar el check.
                    selector
                        .selectAll("option")
                        .data(selectorOptions)
                        .join("option")
                        .attr("value", (d) => d)
                        .text((d) => ticket(d, selectedStations));

                    selectorTexto
                        .text("Llevas "+selectedStations.length+" estacion(es) seleccionada(s).")


                }
            })
        
        selector
            .on("change", (e) => {
                d3.selectAll(".circle")
                    .attr("stroke", "transparent")
                    .attr("r", 2)
                    .attr("opacity", 0.5)
                const valorActual = selector.node().value;
                d3.selectAll("#c"+valorActual)
                    .attr("r", 6)
                    .attr("stroke", "black")
                    .attr("opacity", 1);
                
            })
    })
    .catch((error) => {
        console.log(error);
    })

d3.json("./data/regiones.json")
    .then((datosTopo) => {

        const datos = topojson.feature(datosTopo,datosTopo.objects.regiones);

        // Fitteamos
        const proyeccion = d3.geoMercator().fitSize([width_map, height_map], datos);
        const caminosGeo = d3.geoPath().projection(proyeccion);


        // const point = proyeccion([-23.4503,-70.4411]);
        // const arrayPoint = [point[0], point[1], 1]
        
        chile
            .selectAll("path.continent")
            .data(datos.features)
            .enter()
            .append("path")
                .attr("class", "continent")
                .attr("d", caminosGeo)
                .attr("fill", "lightgrey")
                .attr("opacity", 0.5)
        
        coordenadasEstaciones
            .selectAll(".circle")
            .data(dataEstaciones)
            .join(
                (enter) => {
                    enter
                        .append("circle")
                        .attr("class", "circle")
                        .attr("id", d => "c"+d.codigo_estacion)
                        .attr("cx", d => proyeccion([parseInt(d.longitud), parseInt(d.longitud)])[0])
                        .attr("cy", d => proyeccion([parseInt(d.longitud), parseInt(d.latitud)])[1])
                        .attr("r", 2)
                        .attr("opacity", 0.5)
                        .style("fill", d => d.color)
                        .on("mousedown", function(){
                            d3.selectAll(".circle")
                                .attr("stroke", "transparent")
                                .attr("r", 2)
                                .attr("opacity", 0.5)
                            const id = d3.select(this).attr("id") // c+codigo_estacion
                            d3.select('#selector').property('value', id.slice( 1 ))
                            d3.select(this)
                                .attr("r", 6)
                                .attr("stroke", "black")
                                .attr("opacity", 1);
                            })
                        .on("mouseover", function(){
                            d3.select(this).attr("opacity", 1)
                            d3.select(this).attr("stroke", "black");
                            tooltipTextX_map.text(`${datosProcess[d3.select(this).attr("id").slice(1)].nombre}`)
                            tooltipG_map.attr("display", true)
                                .attr('transform', `translate(${d3.select(this).attr("cx") + 5},
                                                              ${d3.select(this).attr("cy")})`)
                        })
                        .on("mouseout", function(){
                            tooltipG_map.attr("display", "none");
                            if(d3.select(this).attr("r") == 2){
                                d3.select(this).attr("opacity", 0.5)
                                d3.select(this).attr("stroke", "transparent");
                            }
                        });
    
                }
            )    
    })
    .catch((error) => {
        console.log(error);
    })

        