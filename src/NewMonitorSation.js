import React from 'react';
import axios from 'axios';
import { Redirect } from 'react-router-dom';
import Marquee from './Marquee';
import Horloge from './Horloge';
import Slider from "react-slick";
import Textfit from "react-textfit";
import MapTrain from './TrainMapRT';
import {isEmpty, some, find} from 'lodash';
import { Map, TileLayer } from 'react-leaflet';
import { Helmet } from "react-helmet";
import { API_IP, SSL, THNDER_KEY } from './config';
import Loader from 'react-loaders';
import Modal from 'react-modal';
//import {Helmet} from 'react-helmet';
//import {VelocityComponent} from 'velocity-react';

let stationHeight;
let stationElem;

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
					<div className={"train" + (train.state ? (train.state === "retardé" ? " delayed" : ((train.state === "supprimé") ? " canceled" : "")) : "")} key={i}>
						<div className="force-height"></div>
						<div className="group group-left">
							<span className="numero-train">{train.name}</span>
							{train.state ? <span className="retard-train">{train.state}</span> : ""}
							{train.distance ? <span title={train.distance.lPosReport} onClick={() => props.openModal(train.number)} className="distance-train">{train.distance.dataToDisplay.distance}</span> : ""}
							<br className="after-retard-train" />
						</div>
						<div className="group group-middle">
							<span className="heure-train">{train.expectedDepartureTime}</span>
						</div>
						<div className="group">
							<span className="destination-train" title={train.route.name}>
								<span className={train.route.line.type + " symbole light alpha"} style={train.route.line.type !== 'ter' ? { height: "1em", width: "1em", top: "0.1em", left: "0" } : { height: "1em", top: "0.1em", left: "0" }} />
								{train.route.line.type !== 'ter' ? <span className={train.route.line.type + " alpha ligne" + train.route.line.code} style={{ height: "1em", width: "1em", top: "0.1em", left: "0" }} /> : ''}
								{" " + train.terminus}
							</span>
							<span className="infos-track">{train.nature ? <span className="train-nature"><span style={{ fontSize: '0.7em' }}>train<br /></span>{train.nature}</span> : ""}{train.lane !== " " ? <span className="voie-train">{train.lane}</span> : ''}</span>
							<div className="desserte-train" title={train.journey_text}>
								{train.journey_redux ? (train.journey_redux.length !== 0 ? <Marquee velocity={0.06}>{train.journey_text_html}</Marquee> : <p>{train.journey_text}</p>) : <p>desserte indisponible</p>}
							</div>
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
									<div style={{display: "flex", justifyContent: "flex-start"}}>
										{obj.typeMessage !== "NORMAL" ? <div className="logo-trafic-info" style={{padding: "0.23em"}}><img src={require('./tn-icon-'+obj.typeMessage.toLowerCase()+'.svg')} alt="" /></div>:""}
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
			number: 0
		};
		this.tr3a = this.props.match.params.tr3a;
		this.openModal = this.openModal.bind(this);
		this.closeModal = this.closeModal.bind(this);
	}

	getTrainList() {
		return axios.get(`${SSL ? 'https' : 'http'}://${API_IP}/departures?uic=${this.state.station.uic}&lat=${this.state.station.gps.lat}&long=${this.state.station.gps.long}&tr3a=${this.tr3a}`)
			.then(response => {
				//console.log(response.data)
				this.setState({ trains: response.data, isLoading: false })
			})
			.catch(error => {
				this.setState({ error: true })
			});
	}

	getStation() {
		return axios.get(`${SSL ? 'https' : 'http'}://${API_IP}/station/${this.tr3a}`)
			.then(response => {
				this.setState({ station: response.data });
			})
			.catch(error => {
				this.setState({ error: true })
			});
	}

	getTrafic() {
		return axios.post(`${SSL ? 'https' : 'http'}://${API_IP}/trafic`, { lines: this.state.station.lines })
			.then(response => {
				if (!isEmpty(response.data)) {
					this.setState({ trafic: response.data })
				} else {
					this.state.station.lines.map(line => {
						if (!some(response.data, ['ligne.libelleNumero', line])) {
							return response.data.push({
								ligne: {
									libelle: "Ligne " + line
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

	componentDidMount() {
		this.setState({ isLoading: true });

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
		this.setState({ modalIsOpen: true, number: number, train: find(this.state.trains, ['number', number]) })
	}

	componentDidUpdate() {
		// update marker position train
		const train = find(this.state.trains, ['number', this.state.number])
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
						<a href={this.state.train.distance.linkMap} target="blank" style={{ color: 'black', fontSize: '10px', position: "absolute", zIndex: "2" }}>sncf position en temps réél {this.state.train.distance.lPosReport} {this.state.train.route.name} ({this.state.train.departure + " ➜ " + this.state.train.terminus})</a>
						<button onClick={this.closeModal} style={{ position: 'absolute', zIndex: 2, right: 0, top: 0, background: 'white', border: 'none', fontSize: '1em', cursor: 'pointer' }}>✖</button>
						<MapTrain train={this.state.train} station={this.state.station} />
					</Modal>
				}
				{this.state.error === true ? <Redirect to="/" /> : ""}
			</div>
		)
	}
}