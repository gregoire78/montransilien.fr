import React from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Footer from './Footer';
import {result, filter, debounce, find, isEmpty} from 'lodash';
import Loader from 'react-loaders';
//import {Helmet} from "react-helmet";
import 'loaders.css';
//import { Map, TileLayer } from 'react-leaflet';
//import {THNDER_KEY} from './config';
import garesId from './db/gares.json';
import lignes from './db/lignes.json';

/**
 * https://reactjs.org/docs/forms.html#controlled-components
 * https://codesandbox.io/s/3vw2onz526          https://www.peterbe.com/plog/how-to-throttle-and-debounce-an-autocomplete-input-in-react
 * https://stackoverflow.com/questions/23123138/perform-debounce-in-react-js
 */
export class SearchBox extends React.Component {
	constructor(props) {
		super(props);
		this.state = { query: this.props.query };
		this.handleChange = this.handleChange.bind(this);
	}

	componentWillMount() {
		this.handleSearchDebounced = debounce(() => {
			this.props.handleSearch.apply(this, [this.state.query]);
		}, 500);
	}

	handleChange(event) {
		this.setState({ query: event.target.value });
		this.handleSearchDebounced();
	}

	render() {
		return (
			<input type="search" placeholder={this.props.placeholder} value={this.state.query} onChange={this.handleChange} />
		);
	}
}

export default class Home extends React.Component {
	constructor(props) {
		super(props);
		this.state = { result: "", stations: [], isLoading: false };
		this.handleSearch = this.handleSearch.bind(this);
	}

	getLignes(uic) {
		return filter(lignes, { "uic": parseInt(uic) }).map(values => { return values.line })
	}

	getDataAutocomplete(value) {
		/**
		 * https://robwu.nl/cors-anywhere.html
		 * https://github.com/Rob--W/cors-anywhere/
		 * https://medium.com/netscape/hacking-it-out-when-cors-wont-let-you-be-great-35f6206cc646
		 * https://stormy-atoll-29313.herokuapp.com/ (le miens)
		 */
		axios.get(`http://localhost:3000/v1/search/gare/${encodeURI(value)}`)
			.then(response => {
				if (!response.data.error)
					this.setState({ stations: response.data, isLoading: false })
				else
					this.setState({ stations: [], isLoading: false })
			})
			.catch(error => {
				this.setState({ stations: [], isLoading: false })
			});
	}

	handleSearch(query) {
		this.setState({ result: query, isLoading: true });
		this.getDataAutocomplete(query);
	}

	render() {
		//let firstStation = _.first(this.state.stations);
		return (
			<div id="Home">
				{/*<Helmet>
					<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/leaflet.css"/>
				</Helmet>*/}
				<div className="content">
					<h1><img src="./favicon144.png" alt="logo train" /><span>Mon Transilien</span></h1>
					<div className="search">
						<SearchBox query={this.state.result} placeholder="Rechercher une gare" handleSearch={this.handleSearch} />
						<Loader type="ball-pulse" color="#e6e014" style={{ transform: 'scale(0.5)' }} active={this.state.isLoading} size="md" />
						<div>
							{this.state.stations.map((v, i) => {
								const line = this.getLignes(v.id);
								console.log(line)
								return (
									<p key={i} style={{ marginTop: ".3em" }}>
										<Link to={v.id} ><LignesSymboles lignes={line} /> {v.name}</Link>
									</p>
								)
							})}
						</div>
					</div>
				</div>
				{
				//	isEmpty(this.state.stations) ? "" :
				//		<Map
				//			zoomControl={false}
				//			scrollWheelZoom={false}
				//			style={{ position: 'fixed', top: '0', left: '0', zIndex: '-100', width: '100%', height: '100%', margin: 'auto' }}
				//			center={[firstStation.latitude, firstStation.longitude]}
				//			zoom={17}
				//		>
				//			<TileLayer
				//				attribution="Tiles Courtesy of <a href=&quot;http://www.thunderforest.com&quot; target=&quot;_blank&quot;>Thunderforest</a> - &amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
				//				url={"https://{s}.tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png?apikey=" + THNDER_KEY}
				//			/>
				//			{/*<Marker position={[firstStation.latitude, firstStation.longitude]}>
				//				<Popup>
				//					<span><p>Gare de {firstStation.name}</p><p>{firstStation.address}</p></span>
				//				</Popup>
				//			</Marker>*/}
				//		</Map>
				}
				<Footer />
			</div>
		)
	}
}

function LignesSymboles(props) {
	return props.lignes.map((ligne, i) => {
		return (
			<span key={i} className={"line-img alpha ligne" + ligne} style={{ height: "1em", width: "1em", top: "0.1em", left: "0" }} />
		)
	})
}