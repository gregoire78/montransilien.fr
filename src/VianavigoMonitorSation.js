import React from 'react';
import axios from 'axios';
import { Redirect } from 'react-router-dom';
import Marquee from './Marquee';
import Horloge from './Horloge';
import Slider from "react-slick";
import Textfit from "react-textfit";
import MapTrain from './vianavigoTrainMapRT';
import { isEmpty, some, find, join, map } from 'lodash';
import { Map, TileLayer } from 'react-leaflet';
import { Helmet } from "react-helmet";
import { API_IP, SSL, THNDER_KEY } from './config';
import Loader from 'react-loaders';
import Modal from 'react-modal';
import moment from 'moment-timezone';
//import {Helmet} from 'react-helmet';
//import {VelocityComponent} from 'velocity-react';

let stationHeight;
let stationElem;

function getArrivalStatus(arrivalStatus) {
	switch (arrivalStatus) {
		case 'DELAYED':
			return "retardé";
		case 'CANCELLED':
			return "supprimé";
		case 'ON_TIME':
			return "à l'heure";
		default:
			return arrivalStatus;
	}
}

function getCommercialMode(type) {
	switch (type) {
		case 'TRAIN':
			return "transilien";
		case 'RER':
			return "rer";
		case 'TER':
			return "ter";
		default:
			return "";
	}
}

function ListOfTrainLoaded(props) {
	return (
		<div ref={(elem) => {
			if (elem) {
				stationHeight = window.innerHeight - elem.clientHeight;
				if (props.data.trains.length >= 7 && stationHeight <= 95) { stationElem.style.height = stationHeight + "px"; stationElem.style.lineHeight = stationHeight + "px"; }
				else { stationElem.style.height = "50px"; stationElem.style.lineHeight = "50px"; }
			}
		}} id="listetrains">
			{props.data.trains.map((train, i) => {
				return (
					<div className={"train " + (train.arrivalStatus ? train.arrivalStatus.toLowerCase() : "")} key={`${i}_${train.vehicleNumber}`}>
						<div className="force-height"></div>
						<div className="group group-left">
							<span className="numero-train">{train.vehicleName}</span>
							<span className="retard-train">{getArrivalStatus(train.late && train.arrivalStatus !== "CANCELLED" ? train.late : train.arrivalStatus)}</span>
							{train.distance ? <span title={`dernière postion à ${train.distance.lPosReport}`} onClick={() => props.openModal(train.distance.savedNumber)} className="distance-train">{train.distance.dataToDisplay.distance}</span> : ""}
							<br className="after-retard-train" />
						</div>
						<div className="group group-middle">
							<span className="heure-train">{moment(train.expectedDepartureTime ? train.expectedDepartureTime : train.aimedDepartureTime).format('HH:mm')}</span>
						</div>
						<div className="group">
							<span className="destination-train" title={(train.stop_informations ? train.stop_informations.route.name : "") + "\n" + train.vehicle_journey_text}>
								<span className={getCommercialMode(train.type) + " symbole light alpha"} style={train.type !== 'TER' ? { height: "1em", width: "1em", top: "0.1em", left: "0" } : { height: "1em", top: "0.1em", left: "0" }} />
								{train.type !== 'TER' && train.line ? <span className={getCommercialMode(train.type) + " alpha ligne" + train.line.code} style={{ height: "1em", width: "1em", top: "0.1em", left: "0" }} /> : ''}
								{" " + train.destinationName_rename}
							</span>
							<span className="infos-track">{train.nature ? <span className="train-nature"><span style={{ fontSize: '0.7em' }}>train<br /></span>{train.nature}</span> : ""}{train.arrivalPlatformName && train.arrivalPlatformName !== " " ? <span className="voie-train">{train.arrivalPlatformName}</span> : ''}</span>
							{(i <= 1) &&
								<div className="desserte-train" title={train.vehicle_journey_text}>
									{train.vehicle_journey_redux ? (train.vehicle_journey_redux.length !== 0 ? <Marquee velocity={0.06}>{join(map(train.vehicle_journey_redux, (o) => { return o.rename }), ' <span class="dot-separator">•</span> ')}</Marquee> : <p>{train.vehicle_journey_text}</p>) : ""}
								</div>
							}
						</div>
					</div>
				)
			})}
		</div>
	);
}

function TraficMessage(props) {
	const settings = {
		dots: true,
		arrows: false,
		infinite: true,
		vertical: true,
		verticalSwiping: true,
		autoplay: true,
		autoplaySpeed: 8000,
		speed: 1500,
		accessibility: false,
		className: "slide-trafic",
		appendDots: dots => (
			<ul id="dots-trafic"> {dots} </ul>
		),
	};
	return (
		<div className="trafic">
			<Slider {...settings}>
				{props.data.trafic.map((obj, k) => {
					let content = obj.typeMessage === "TRAVAUX" ? { contenu: obj.contenu, color: "#EA663A" } :
						(obj.typeMessage === "TRAFIC" ? { contenu: obj.detailsFormatTexte, color: "#DC0052" } :
							{ contenu: obj.detailsFormatTexte, color: "#8BC34A" });
					//const text = `${obj.ligne.libelle} : ${content.contenu}`
					return (
						<div key={k}>
							<div className="content-trafic" style={{ color: content.color }}>
								<Textfit className="fite" mode="multi" forceSingleModeWidth={false} max={40}>
									<div style={{ display: "flex", justifyContent: "flex-start" }}>
										{obj.typeMessage !== "NORMAL" ? <div className="logo-trafic-info" style={{ padding: "0.23em" }}><img src={require('./tn-icon-' + obj.typeMessage.toLowerCase() + '.svg')} alt="" /></div> : ""}
										<div><span style={{ background: "black", fontStyle: "italic", paddingRight: "0.25em", paddingLeft: "0.1em" }}><span>{obj.ligne.libelle}</span></span> {content.contenu}</div>
									</div>
								</Textfit>
							</div>
						</div>
					)
				})}
			</Slider>
		</div>
	)
}

// Make sure to bind modal to your appElement (http://reactcommunity.org/react-modal/accessibility/)
Modal.setAppElement('body');
//Modal.defaultStyles.overlay.backgroundColor = 'cornsilk';
const customStyles = {
	content: {
		padding: "10px",
		top: '10px',
		left: '10px',
		right: '10px',
		bottom: '10px',
	}
};
export default class MonitorStation extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			station: {},
			trains: [],
			trafic: [],
			isLoading: false,
			error: false,

			modalIsOpen: false,
			train: {},
			number: 0,
			geo: {}
		};
		this.uic = this.props.match.params.uic;
		this.openModal = this.openModal.bind(this);
		this.closeModal = this.closeModal.bind(this);
	}

	getTrainList() {
		return axios.get(`${SSL ? 'https' : 'http'}://${API_IP}/v2/realtime/uic/${this.uic}?lat=${this.state.station.gps.lat}&long=${this.state.station.gps.long}`)
			.then(response => {
				this.setState({ trains: response.data.monitored_stop_visit, isLoading: false })
			})
			.catch(error => {
				this.setState({ error: true })
			});
	}

	getStation() {
		return axios.get(`${SSL ? 'https' : 'http'}://${API_IP}/v1/search/uic/${this.uic}`)
			.then(response => {
				this.setState({ station: response.data });
			})
			.catch(error => {
				this.setState({ error: true })
			});
	}

	getTrafic() {
		return axios.post(`${SSL ? 'https' : 'http'}://${API_IP}/v1/trafic`, { lines: this.state.station.lines.map(v => v.code) })
			.then(response => {
				if (!isEmpty(response.data)) {
					this.setState({ trafic: response.data })
				} else {
					this.state.station.lines.map(line => {
						if (!some(response.data, ['ligne.libelleNumero', line])) {
							return response.data.push({
								ligne: {
									libelle: "Ligne " + line.code
								},
								typeMessage: "NORMAL",
								detailsFormatTexte: "Trafic normal"
							})
						} else return false
					})
					this.setState({ trafic: response.data })
				}
			})
			.catch(error => {
				this.setState({ trafic: [] })
			});
	}

	componentWillMount() {
		document.title = "Chargement gare ...";
	}

	async componentDidMount() {
		this.setState({ isLoading: true, geo: (await import('./db/traces-du-reseau-ferre-idf.json')) });
		this.getStation()
			.then(() => Promise.all([this.getTrainList(), this.getTrafic()]))
			.then(() => {
				document.title = this.state.station.name;
				if (!this.state.error) {
					this.interval = setInterval(this.getTrainList.bind(this), 15000);
					this.intervalTrafic = setInterval(this.getTrafic.bind(this), 60000);
				}
			})
			.catch(error => { });
	}

	componentWillUnmount() {
		// use intervalId from the state to clear the interval
		clearInterval(this.interval);
		clearInterval(this.intervalTrafic);
	}

	openModal(number) {
		this.setState({ modalIsOpen: true, number: number.toString(), train: find(this.state.trains, ['vehicleNumber', number.toString()]) })
	}

	componentDidUpdate() {
		// update marker position train
		const train = find(this.state.trains, ['vehicleNumber', this.state.number])
		if (this.state.modalIsOpen && this.state.train !== train) {
			this.setState({ train: train })
		}
	}

	closeModal() {
		this.setState({ modalIsOpen: false });
	}

	render() {
		const listOfTrains = this.state.isLoading ? (
			<div style={{
				display: 'flex',
				justifyContent: 'center',
				height: '100vh',
				alignItems: 'center',
				backgroundColor: 'rgba(25, 25, 39, 0.88)',
			}}>
				<Loader type="pacman" active style={{ height: "50px" }} />
			</div>
		) : (
				<ListOfTrainLoaded data={this.state} openModal={this.openModal} />
			)
		return (
			<div>
				<Helmet>
					<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/leaflet.css" />
				</Helmet>
				<div id="listView" className="content-list">
					{/*<Helmet defer={true} >
						<link rel="stylesheet" type="text/css" href="dark.css" />
					</Helmet>*/}
					<Horloge />
					{!this.state.isLoading ? <div ref={elem => stationElem = elem} className="station-name"><span>{this.state.station.name}</span></div> : ""}
					{listOfTrains}
					<div id="bottomList"></div>
					{!this.state.isLoading ? <TraficMessage data={this.state} /> : ""}
					<div id="bottomList-small"></div>
				</div>

				{isEmpty(this.state.station) ? "" :
					<Map
						zoomControl={false}
						scrollWheelZoom={false}
						style={{ position: 'fixed', top: '0', left: '0', zIndex: '-100', width: '100%', height: '100%', margin: 'auto' }}
						center={[this.state.station.gps.lat, this.state.station.gps.long]}
						zoom={18}>
						<TileLayer
							attribution="Tiles Courtesy of <a href=&quot;http://www.thunderforest.com&quot; target=&quot;_blank&quot;>Thunderforest</a> - &amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
							url={"https://{s}.tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png?apikey=" + THNDER_KEY}
						/>
					</Map>
				}
				{isEmpty(this.state.train) ? "" :
					<Modal
						isOpen={this.state.modalIsOpen}
						onRequestClose={this.closeModal}
						contentLabel="Example Modal"
						style={customStyles}>
						<a href={this.state.train.distance.linkMap} target="blank" style={{ color: 'black', fontSize: '10px', position: "absolute", zIndex: "2" }}>sncf position en temps réél {this.state.train.distance.lPosReport} {this.state.train.stop_informations ? this.state.train.stop_informations.route.name : ""} ({" ➜ " + this.state.train.destinationName})</a>
						<button onClick={this.closeModal} style={{ position: 'absolute', zIndex: 2, right: 0, top: 0, background: 'white', border: 'none', fontSize: '1em', cursor: 'pointer' }}>✖</button>
						<MapTrain train={this.state.train} station={this.state.station} geo={this.state.geo} />
					</Modal>
				}
				{this.state.error === true ? <Redirect to="/" /> : ""}
			</div>
		)
	}
}