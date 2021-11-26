import * as d3B from 'd3'
import * as topojson from 'topojson'
import * as geoProjection from 'd3-geo-projection'
import worldMap from 'assets/ne_10m_admin_0_countries_crimea_ukraine_simple.json'
import { numberWithCommas } from 'shared/js/util'
import autoComplete from "@tarekraafat/autocomplete.js"
import textures from 'textures'
console.log('V10')

const smallTerritories = [
{code:'SMR',latlon:[12.4493909,43.9257983]},
{code:'ABW',latlon:[-70.037329,12.518514]},
{code:'TCA',latlon:[-72.0702869,21.5742147]},
{code:'PCN',latlon:[-128.8550635,-24.4786052]},
{code:'SYC',latlon:[48.9440093,-7.079550]},
{code:'MHL',latlon:[161.7326398,9.5715091]},
{code:'MSR',latlon:[-62.2626421,16.7486897]},
{code:'AIA',latlon:[-63.3402346,18.390143]},
{code:'VGB',latlon:[-64.7114346,18.5222738]},
{code:'BMU',latlon:[-64.8364398,32.3194245]},
{code:'SHN',latlon:[-19.2777831,-23.7846766]},
{code:'IOT',latlon:[71.3265241,-6.3129838]},
{code:'COK',latlon:[-165.4335055,-15.5725838]},
{code:'WLF',latlon:[-177.7232286,-13.7725442]},
{code:'TUV',latlon:[175.5367425,-8.2979078]},
{code:'MDV',latlon:[70.9962425,3.1152069]},
{code:'NRU',latlon:[166.91764345,-0.527937]},
{code:'MAC',latlon:[113.5351332,22.1619078]},
{code:'Balearic', latlon:[2.9771207,39.6814459]},
{code:'Madeira', latlon:[-16.9587455,32.703783]}
]

const d3 = Object.assign({}, d3B, topojson, geoProjection);

const atomEl = d3.select('.interactive-wrapper-map').node()

const isMobile = window.matchMedia('(max-width: 600px)').matches;

let width = atomEl.getBoundingClientRect().width;
let height =  width * 2.5 / 5;

let projection = d3.geoRobinson();

let path = d3.geoPath()
.projection(projection);

let extent = {
        type: "LineString",

         coordinates: [
            [-180, -60],
            [180, -60],
            [180, 90],
            [-180, 90],
        ]
}

projection
.fitExtent([[0, 0], [width, height]], extent);

const filtered = topojson.feature(worldMap, worldMap.objects['world-map-crimea-ukr']).features.filter(f => f.properties.ADMIN != 'Antarctica')

const map = d3.select('.map-container')
.append('svg')
.attr('id', 'travel-map')
.attr('width', width)
.attr('height', height);

map.append("rect")
.attr("class", "gv-background")
.attr("width", width)
.attr("height", height)
.on("click", d => clicked())

let resetZoom = d3.select("#gv-choropleth-svg")
.on("click", d => clicked());

const geo = map.append('g')
const smalls = map.append('g')


const tooltip = d3.select('.tooltip-map-list')

const svgY = d3.select(".map-search-box").node().getBoundingClientRect().height;


d3.json('https://interactive.guim.co.uk/docsdata-test/1E0n10TGSGEMSLdOrG0sn7UYnwhO4EIvwC8W4wyff9hA.json')
//d3.json('https://interactive.guim.co.uk/docsdata/1E0n10TGSGEMSLdOrG0sn7UYnwhO4EIvwC8W4wyff9hA.json')
.then(data => {

	console.log(data.sheets.update[0].date)

	d3.select('.map-source')
	.html('Guardian graphic. Source: Department for Transport. Updated ' + data.sheets.update[0].date)

	let lights = data.sheets['light-colour-list'];

	console.log(lights)

	lights.map(d => {

		let match = filtered.find(f => f.properties.ISO_A3 === d.code)

		if(match)
		{
			match.status = d.status;
			match.country = d.country;
			match.code = d.code;
			match.notes = d.notes;
			match.future_status = d.future_status;
		}
		else
		{
			if(d.lat != '' && d.lon != '')
			{
				let circle = smalls.append('circle')
				.attr('r', 5)
				.attr('transform', 'translate(' + projection([d.lat,d.lon])[0] + ',' + projection([d.lat,d.lon])[1] + ')')
				.attr('class', d.future_status == '' ? d.code + ' map-' + d.status :  d.code )
				.style('stroke-width', '1px')
				.attr('fill', function(){

					if(d.future_status){

						return getTexture(d.status, d.future_status)
					}

				})
				.on('mousemove', e => manageMove(e, d.country, d.code, d.status, d.notes))
				.on('mouseout', d => {
					geo.selectAll('path')
					.classed('over', false)
					smalls.selectAll('circle').classed('over', false)
					tooltip.classed('over', false)
				})
				.on('click', () => clicked(d))
			}
		}
	})


	let ireland = filtered.find(f => f.properties.ISO_A3 === 'IRL')

	ireland.status = 'common';
	ireland.country = 'Ireland';

	geo
	.selectAll('path')
	.data(filtered)
	.enter()
	.append('path')
	.attr('class', d =>  {

		
			if(d.properties.ISO_A3 === 'IRL')return d.properties.ISO_A3 + ' map-' + d.status
			else return d.code + ' map-' + d.status
		

	})
	.attr('d', path)
	.attr('fill', '#DADADA')
	.attr('fill', d => {

		if(d.future_status){

			map.select('.' + d.code).attr('class', d.code)

			return getTexture(d.status, d.future_status)
		}
		else{
			return '#DADADA'
		}
	})
	.attr('stroke', '#ffffff')
	.attr('stroke-width','1px')
	.attr('stroke-linecap', 'round')
	.on('mouseout' , d => {

		geo.selectAll('path')
		.classed('over', false)

		tooltip.classed('over', false)

	})
	.on('mousemove', (e,d) =>{ 

		if(d.country && d.code != undefined)manageMove(e, d.country, d.code, d.status, d.notes)
		if(d.country === 'Ireland') manageMove(e, d.country, 'IRL', d.status)
	})
	.on('click', (event,d) => clicked(d))
	.attr('size', d => {

		let territory = filtered.find(f => f.properties.ISO_A3 === d.properties.ISO_A3);

		let isSmall = smallTerritories.find(f => f.code === d.code)

		let centroid = isSmall ? projection(isSmall.latlon) : path.centroid(territory);

		let w = geo.select('.' + d.code).node().getBoundingClientRect().width;
		let h = geo.select('.' + d.code).node().getBoundingClientRect().height;

		let area = w * h;

		if(area <= 67 && d.status && !isMobile || area <= 67 && d.status && isMobile)
		{


			let circle = smalls.append('circle')
			.attr('r', 5)
			.attr('cx', centroid[0])
			.attr('cy',  centroid[1])
			.attr('class', d.properties.ISO_A3 + ' map-' + d.status)
			.style('stroke-width', '1.5px')
			.style('stroke', 'white')
			.attr('fill', function(){

				if(d.future_status){

					smalls.select('.' + d.code).attr('class', d.code + ' raise' )

					return getTexture(d.status, d.future_status)
				}

			})
			.on('mousemove', e => {
				if(d.country && d.code != undefined)manageMove(e, d.country, d.code, d.status, d.notes)
				if(d.country === 'Ireland') manageMove(e, d.country, 'IRL', d.status)
			})
			.on('mouseout', d => {
				geo.selectAll('path')
				.classed('over', false)
				smalls.selectAll('circle').classed('over', false)
				tooltip.classed('over', false)
			})
			.on('click', () => clicked(d))

		}
	} )

	smalls.selectAll('.raise')
	.raise()


	map.select('.GBR')
	.attr('pointer-events', 'none')

	let countries = [];

	lights.map(d => {

		if(d.code != '#N/A')countries.push({"country": d.country, "code": d.code})
	})

	let cancel = d3.select('.map-search-box .map-search-cancel')
	.on('click', d => {
		document.querySelector(".map-search-box #map-autoComplete").value = '';
		cancel.style('opacity', 0);

		tooltip.classed('over', false)

		map.selectAll('path')
			.classed('over', false)

		clicked()
	})

	const autoCompleteJs = new autoComplete({
            selector: "#map-autoComplete",
            placeHolder: "Search by country",
            data: {
            	src:countries,
            	key: ["country"]
            },
            resultsList: {
                noResults: (list, query) => {
                    const message = document.createElement("div");
                    message.setAttribute("class", "no_result")
                    message.innerHTML = `<span>Found no results for "${query}"</span>`;
                    list.appendChild(message);
                },
            },
            resultItem: {
                highlight: {
                    render: true
                }
            },
		  searchEngine: "strict",
		  highlight: {
		      render: true,
		  },
		  onSelection: (feedback) => {

		    document.querySelector("#map-autoComplete").value = feedback.selection.value.country;

		    cancel
		    .style('opacity', 1)

		    geo.selectAll('path')
			.classed('over', false)

			smalls.selectAll('circle')
			.classed('over', false)

			let light = lights.find(f => f.code === feedback.selection.value.code)

			let country = filtered.find(f => f.properties.ISO_A3 === feedback.selection.value.code)

			let centroid = path.centroid(country);

			let verb;

			feedback.selection.value.country.indexOf('Akrotiri and Dhekelia') != -1 ? verb = 'are' : verb = 'is'

			let message = `<span class=map-${light.status}>${feedback.selection.value.country}</span> ${verb} on the <span class=c-${light.status}>${light.status}</span> list`

			tooltip.select('.tooltip-status').html(message)
			tooltip.select('.tooltip-notes').html(light.notes)

			clicked(country)

			if(geo.select('.' + feedback.selection.value.code).node())
			{
				/*let pos = geo.select('.' + feedback.selection.value.code).node().getBBox()

				manageTooltip(pos.x + pos.width, pos.y + pos.height)*/
			}
			else
			{
				let individual = lights.find(f => f.code === feedback.selection.value.code)

				let pos = projection([individual.lat, individual.lon])

				manageTooltip(pos[0], pos[1])
			}

			map.selectAll('.' + feedback.selection.value.code)
			.classed('over', true)
			.raise()
		    
		    
		  }	
		});


	if(window.resize)window.resize()
})


const manageTooltip = (pos_x, pos_y) => {

	tooltip.classed('over', true)

	let tWidth = +tooltip.node().getBoundingClientRect().width;
	let tHeight = +tooltip.node().getBoundingClientRect().height;

	let posX = pos_x - tWidth / 2;
    let posY = pos_y + 15;

	if(posX + tWidth > width) posX = width - tWidth;
    if(posX < 0) posX = 0;

	tooltip.style('top', posY + svgY + 'px')

	tooltip.style('left', posX + 'px')


}

const manageMove = (event, country, code, status, notes = '') => {


	smalls.selectAll('circle')
	.classed('over', false)

	map.selectAll('.' + code)
	.classed('over', true)
	.raise()

	let verb = status == '' ? 'is not' : 'is';

	let message = country == 'Ireland' ? `Ireland is part of the common travel area` :`<span class=map-${status}>${country}</span> ${verb} on the red list`

	tooltip.select('.tooltip-status').html(message)
	tooltip.select('.tooltip-notes').html(notes)

	tooltip.classed('over', true)

    let left = width > 620 ? event.clientX + atomEl.getBoundingClientRect().left : event.clientX;
    let top = event.clientY + -atomEl.getBoundingClientRect().top;

    let tWidth = tooltip.node().getBoundingClientRect().width;
    let tHeight = tooltip.node().getBoundingClientRect().height;

    let posX = width > 620 ? left - (tWidth /2) : left - atomEl.getBoundingClientRect().left -( tWidth /2);
    let posY = top /*+ svgY*/ + tHeight;

    //if(posX + tWidth > width) posX = width - tWidth;
    //if(posX < 0) posX = 0;

    tooltip.style('left',  posX + 'px')
    tooltip.style('top', posY + 'px')

}


const getTexture = (status, future_status) => {

	let color1 = "#707070";
	let color2 = "#dadada";

	switch (future_status) {
		case "red": color1 = "#c70000"; break;
		case "amber": color1 = "#F5BE2C"; break;
		case "green": color1 = '#2BADBC'; break;
	}

	switch (status) {
		case "red": color2 = "#c70000"; break;
		case "amber": color2 = "#F5BE2C"; break;
		case "green": color2 = '#2BADBC'; break;
	}


	let texture = textures.lines()
	.orientation("diagonal")
	.size(6)
	.strokeWidth(1)
	.stroke(color1)
	.background(color2);

	map.call(texture)

	return texture.url()

}



let centered;

const clicked = (d) => {

  var x, y, k;

  if (d && centered !== d) {

    var centroid = d.geometry ? path.centroid(d) : projection(smallTerritories.find(f => f.code === d.code).latlon);

    x = centroid[0];
    y = centroid[1];
    k = 4;

    centered = d;

  }
  else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;

    tooltip.classed('over', false)

    map.selectAll('path')
    .classed('over', false)
  }

  /*geo.selectAll("path")
  .classed("active", centered && function(d) { return d === centered; });*/

  geo.transition()
  .duration(750)
  .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
  .on('end', () => {
  	if(d)manageTooltip(width / 2, height / 2)
  })

  
  map.selectAll('path')
  .transition()
  .duration(750)
  .style("stroke-width", 1 / k + "px")

  /*smalls.selectAll("path")
  .classed("active", centered && function(d) { return d === centered; });
*/
  smalls.transition()
  .duration(750)
  .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")

  smalls.selectAll('circle')
  .transition()
  .duration(750)
  .style("stroke-width", 1.5 / k + "px")
  .attr("r", 5 / k + "px")

  resetZoom
  .style('display', centered ? 'block' : 'none')


}
