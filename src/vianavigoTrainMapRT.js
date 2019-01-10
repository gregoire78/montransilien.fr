import React from 'react';
import { Icon, LatLngBounds, LatLng, divIcon, Point } from 'leaflet';
import { Map, TileLayer, Marker, Popup, ZoomControl, Tooltip, GeoJSON, Polyline } from 'react-leaflet';
import moment from 'moment-timezone';
import { THNDER_KEY } from './config';
import 'moment/locale/fr';

export default class TrainMapRT extends React.Component {
	constructor(props) {
		super(props);
		this.marker = [];
	}

	openPopupMarker(idx) {
		this.marker[idx].leafletElement.openPopup();
	}

	closePopupMarker(idx) {
		this.marker[idx].leafletElement.closePopup();
	}

	geoJsonDisplay(feature) {
		if (feature.properties.indice_lig === this.props.train.stop_informations.route.line.code) {
			return { color: this.props.train.line.color.code_hexadecimal }
		}
		else if (feature.properties.mode === this.props.train.type.toUpperCase() && feature.properties.mode !== "RER") {
			return { color: "#3c3c3c" }
		} else {
			return { color: "transparent" };
		}
	}

	shouldComponentUpdate(nextProps) {
		return !(nextProps.train.distance.lPosReport === this.props.train.distance.lPosReport)
	}

	componentDidUpdate() {
		//console.log(this.props.train.distance.lPosReport)
		//this.map.leafletElement.fitBounds(this.map.leafletElement.getBounds(), {padding: [40, 40]})
	}

	render() {
		return (
			<Map
				ref={map => { this.map = map; }}
				zoomControl={false}
				scrollWheelZoom={true}
				style={{ width: '100%', height: '100%', zIndex: "1" }}
				//center={new LatLng(this.props.train.distance.gps.lat, this.props.train.distance.gps.long)}
				bounds={new LatLngBounds(
					new LatLng(this.props.train.distance.gps.lat, this.props.train.distance.gps.long),
					new LatLng(this.props.station.gps.lat, this.props.station.gps.long)
				)}
				boundsOptions={{ padding: [105, 105] }}
				zoom={14}>
				<ZoomControl position="bottomleft" />
				<TileLayer
					attribution="Tiles Courtesy of <a href=&quot;http://www.thunderforest.com&quot; target=&quot;_blank&quot;>Thunderforest</a> - &amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
					url={"https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=" + THNDER_KEY}
				/>


				<GeoJSON style={(feature) => this.geoJsonDisplay(feature)} weight={4}>

					<Popup autoPan={false} autoClose={false}>
						<div>
							<div style={{ color: this.props.train.color.code_hexadecimal }}>Ligne {this.props.train.line.code}</div>
							{this.props.train.stop_informations.route.name}<br />
							({this.props.train.stop_informations.stop_point.name + " ➜ " + this.props.train.destinationName})
							<hr />
							{this.props.train.journey ?
								<ul style={{ paddingLeft: "19px", margin: "0", maxHeight: "90px", overflow: "auto" }}>
									{this.props.train.journey.map((jrn, idx) => {
										return <li key={idx}>{jrn.stop_point.name} - <b>{moment(jrn.departure_time, "HHmmss").format('HH[h]mm')}</b></li>
									})}
								</ul>
								: ""}
						</div>
					</Popup>

					<ExtendedMarker
						position={new LatLng(this.props.train.distance.gps.lat, this.props.train.distance.gps.long)}
						icon={new Icon({
							iconUrl: `data:image/svg+xml;base64,
								${btoa(`
									<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" width="8.9958334mm" height="13.969723mm" viewBox="0 0 8.9958334 13.969722" version="1.1">
										<g transform="translate(-98.712816,-145.83696)">
											<g transform="matrix(0.26458333,0,0,0.26458333,72.730804,85.040817)">
												<g style="stroke:#000000;stroke-width:5.23533726;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" transform="matrix(0.09549614,0,0,0.09549614,97.733488,229.29537)">
													<path style="fill:${this.props.train.color.code_hexadecimal};stroke:#000000;stroke-width:5.23533726;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" d="m 182.9,551.7 c 0,0.1 0.2,0.3 0.2,0.3 0,0 175.2,-269 175.2,-357.4 C 358.3,64.5 269.5,7.9 182.9,7.7 96.3,7.9 7.5,64.5 7.5,194.6 7.5,283 182.8,552 182.8,552 Z"/>
												</g>
												<g style="fill:#7d3939;fill-opacity:1;stroke:#000000;stroke-width:2.08555579;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" transform="matrix(0.23974425,0,0,0.23974425,96.211973,228.9906)">
													<path style="fill:#fcfcfc;fill-opacity:1;stroke:#000000;stroke-width:2.08555579;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" d="m 117.433,126.129 -14.751,-16.355 c 0.341,-0.23 0.664,-0.459 0.905,-0.704 2.745,-2.19 5.279,-5.581 7.131,-10.834 2.587,-7.336 4.43,-13.901 4.932,-21.983 0.689,-9.961 -3.415,-25.444 -6.133,-32.659 l -0.948,-2.56 c -0.586,-1.613 -2.815,-5.06 -6.794,-9.179 -3.404,-3.536 -6.68,-3.804 -11.671,-3.804 H 69.845 c -4.99,0 -8.266,0.268 -11.675,3.804 -3.965,4.111 -6.209,7.565 -6.795,9.179 l -0.941,2.564 c -2.726,7.21 -6.839,22.693 -6.141,32.66 0.51,8.064 2.334,14.611 4.924,21.978 1.865,5.253 4.406,8.644 7.147,10.834 0.251,0.241 0.57,0.474 0.913,0.698 l -14.759,16.361 c -1.196,1.325 -1.196,3.495 0,4.817 1.195,1.325 3.143,1.325 4.331,0 l 5.097,-5.652 h 56.059 l 5.083,5.652 c 1.207,1.325 3.147,1.325 4.346,0 1.193,-1.322 1.193,-3.492 -10e-4,-4.817 z M 52.248,70.268 c -1.124,-2.927 1.925,-22.044 3.966,-24.811 h 47.021 c 1.953,2.378 6.021,22.148 4.352,24.811 z m 5.824,48.238 5.434,-6.035 c 2.646,0.606 5.083,0.621 6.863,0.621 h 19.207 c 1.778,0 4.218,-0.015 6.858,-0.621 l 5.447,6.035 z M 57.147,96.249 c 0,-2.691 2.188,-4.873 4.881,-4.873 2.691,0 4.888,2.182 4.888,4.873 0,2.683 -2.197,4.871 -4.888,4.871 -2.693,0 -4.881,-2.188 -4.881,-4.871 z m 40.401,4.757 c -2.694,0 -4.885,-2.193 -4.885,-4.878 0,-2.687 2.191,-4.864 4.885,-4.864 2.698,0 4.881,2.178 4.881,4.864 0.001,2.685 -2.182,4.878 -4.881,4.878 z"/>
												</g>
											</g>
										</g>
									</svg>
								`)}`,
							iconAnchor: [17, 52.8],
							popupAnchor: [0, -50]
						})
						}>
						<Popup closeOnClick={false} autoPan={false} autoClose={false}>
							<div>
								<b>{" " + this.props.train.destinationName}</b><br />
								{this.props.train.vehicleName} - {this.props.train.vehicleNumber} - {this.props.train.distance.dataToDisplay.distance}
							</div>
						</Popup>
					</ExtendedMarker>
					<ExtendedMarker
						position={new LatLng(this.props.station.gps.lat, this.props.station.gps.long)}>
						<Popup closeOnClick={true} autoPan={false} autoClose={false}>
							<div>
								{moment(this.props.train.expectedDepartureTime, "HH[:]mm").format('HH[h]mm')} - {this.props.train.arrivalStatus}
							</div>
						</Popup>
					</ExtendedMarker>

				</GeoJSON>

			</Map>
		)
	}
}

// Create your own class, extending from the Marker class.
class ExtendedMarker extends Marker {
	// "Hijack" the component lifecycle.
	componentDidMount() {
		// Call the Marker class componentDidMount (to make sure everything behaves as normal)
		super.componentDidMount();

		// Access the marker element and open the popup.
		this.leafletElement.openPopup();
	}
}