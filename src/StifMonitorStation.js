import React from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import Marquee from './Marquee';
import Horloge from './Horloge';
import Slider from "react-slick";
import Textfit from "react-textfit";
import MapTrain from './vianavigoTrainMapRT';
import { isEmpty, some, find, join, map, fill, assign } from 'lodash';
import { Helmet } from "react-helmet";
import { API_IP, SSL } from './config';
import Modal from 'react-modal';
import moment from 'moment-timezone';
import ReactTooltip from 'react-tooltip';

function getCommercialMode(type) {
	switch (type) {
		case 'TRAIN':
			return "transilien";
		case 'RER':
			return "rer";
		default:
			return "";
	}
}
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
function ListOfTrainLoaded(props) {
	return (
		<div id="listetrains">
			{props.trains.map((train, k) => {
				if (train !== null) {
					const type = getCommercialMode(train.type);
					return (
						<div key={`${k}_${train.vehicleNumber}`} className={"train " + (train.arrivalStatus ? train.arrivalStatus.toLowerCase() : "")}>
							<div className="group group-left">
								<span className="numero-train">{train.vehicleName}</span>
								{train.arrivalStatus && <span className="retard-train">{getArrivalStatus(train.late && train.arrivalStatus !== "CANCELLED" ? train.late : train.arrivalStatus)}</span>}
							</div>
							<div className="group group-middle">
								<span className="heure-train">{moment(train.expectedDepartureTime ? train.expectedDepartureTime : train.aimedDepartureTime).format('HH:mm')}</span></div>
							<div className="group group-right">
								<div className="group-details">
									<span className="destination-train" data-for='traintitle' data-tip-disable={!(train.vehicle_journey_redux.length > 0)} data-tip={JSON.stringify({ vj: train.vehicle_journey_redux, info: train.stop_informations ? train.stop_informations.route.name : "" })}>
										<span className={type + " symbole light alpha"} style={{ height: "1em", width: "1em", left: "0" }} />
										<span className={type + " alpha ligne" + train.line.code} style={{ height: "1em", width: "1em", left: "0", marginRight: "5px" }} />
										<span className="text">{train.destinationName_rename ? train.destinationName_rename : train.destinationName}</span>
									</span>
									<span className="infos-track">
										{train.distance && <span title={`dernière postion à ${train.distance.lPosReport}`} onClick={() => props.openModal(train.distance.savedNumber)} className="train-nature">{train.distance.dataToDisplay.distance}</span>}
										{!train.distance && <span className="no train-nature">&nbsp;</span>}
										{train.arrivalPlatformName && <span className="voie-train">{train.arrivalPlatformName}</span>}
									</span>
								</div>
								{(k <= 1) &&
									<div className="desserte-train">
										{train.vehicle_journey_redux ? (train.vehicle_journey_redux.length !== 0 ? <Marquee velocity={0.06}>{join(map(train.vehicle_journey_redux, (o) => { return o.rename }), ' <span class="dot-separator">•</span> ')}</Marquee> : train.vehicle_journey_text) : ""}
									</div>
								}
							</div>
						</div>
					)
				} else {
					return (
						<div key={k + "null"} className="train">
							<div className="group group-left">
								<span className="numero-train">&nbsp;</span>
							</div>
							<div className="group group-middle">
								<span className="heure-train">&nbsp;</span>
							</div>
							<div className="group group-right">
								<div className="group-details">
									<span className="destination-train">
										<span className="text">{props.isLoading && k <= 1 ? 'Chargement ...' : <>&nbsp;</>}</span>
									</span>
								</div>
								{(k <= 1) &&
									<div className="desserte-train">&nbsp;</div>
								}
							</div>
						</div>
					)
				}
			})}
			<ReactTooltip id='traintitle' getContent={(dataTip) => {
				return dataTip ? <div>
					<p style={{ textDecoration: "underline" }}>{JSON.parse(dataTip).info}</p>
					{JSON.parse(dataTip).vj.map((v, k) => { return (<div key={k}>{v.departure_time_formated} - {v.rename}</div>) })}
				</div> : ""
			}}></ReactTooltip>
		</div>
	);
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
			station: { name: <>&nbsp;</>, lines: [] },
			trains: fill(new Array(8), null),
			trafic: [],
			isLoading: true,
			error: false,

			modalIsOpen: false,
			train: {},
			number: 0,
			geo: {}
		};
		this.uic = this.props.match.params.uic;
		this.openModal = this.openModal.bind(this);
		this.closeModal = this.closeModal.bind(this);
		this.socket = io.connect(`${SSL ? 'https' : 'http'}://${API_IP}`);
	}

	getTrainList() {
		return axios.get(`${SSL ? 'https' : 'http'}://${API_IP}/v2/realtime/zde/${this.uic}?lat=${this.state.station.gps.lat}&long=${this.state.station.gps.long}`)
			.then(response => {
				this.setState({ trains: assign(fill(new Array(8), null), response.data.monitored_stop_visit), isLoading: false }, () => { ReactTooltip.rebuild(); })
			})
			.catch(error => {
				this.setState({ error: true })
			});
	}

	getStation() {
		return axios.get(`${SSL ? 'https' : 'http'}://${API_IP}/v2/search/zde/${this.uic}`)
			.then(response => {
				document.title = response.data.name;
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
								detailsFormatTexte: "Trafic normal",
								contenu: "Trafic normal",
							})
						} else return false
					})
					this.setState({ trafic: response.data })
				}
			})
			.catch(error => {
				console.log(error)
				this.setState({ trafic: [] })
			});
	}

	async componentDidMount() {
		this.socket.on('connect', () => {
			this.getStation()
				.then(() => this.socket.emit('hello', { zde: this.uic, lat: this.state.station.gps.lat, long: this.state.station.gps.long })) // on envoi le bonjour au server
				.then(() => Promise.all([/*this.getTrainList(),*/ this.getTrafic()]))
				.then(async () => {
					if (!this.state.error) {
						this.setState({ geo: (await import('./db/traces-du-reseau-ferre-idf.json')) });
						//this.interval = setInterval(this.getTrainList.bind(this), 15000);
						this.intervalTrafic = setInterval(this.getTrafic.bind(this), 60000);
					}
				})
				.catch(error => { });
		});

		this.socket.on('trains_by_server', async (data) => {
			this.setState((prevState) => {
				// fill array with null si moins de 8 resultats
				return { trains: assign(fill(new Array(8), null), data.monitored_stop_visit), isLoading: false }
			}, () => { ReactTooltip.rebuild(); });
		});
	}

	componentWillUnmount() {
		// use intervalId from the state to clear the interval
		//clearInterval(this.interval);
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
		return (
			<>
				<Helmet>
					<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/leaflet.css" />
				</Helmet>
				<div id="listView" className="content-list">
					<Horloge />
					<h1 style={{ textAlign: 'center' }}>{this.state.station.name}</h1>
					<ListOfTrainLoaded trains={this.state.trains} openModal={this.openModal} isLoading={this.state.isLoading} />
					<div id="bottomList"></div>
					<TraficMessage trafic={this.state.trafic} />
					<div id="bottomList-small"></div>
				</div>

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
			</>
		)
	}
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
				{props.trafic.map((obj, k) => {
					let content = obj.typeMessage === "TRAVAUX" ? { contenu: obj.contenu, color: "#EA663A" } :
						(obj.typeMessage === "TRAFIC" ? { contenu: obj.contenu, color: "#DC0052" } :
							{ contenu: obj.contenu, color: "#8BC34A" });
					//const text = `${obj.ligne.libelle} : ${content.contenu}`
					return (
						<div key={k}>
							<div className="content-trafic" style={{ color: content.color }}>
								<Textfit className="fite" mode="multi" forceSingleModeWidth={false} max={40}>
									<div style={{ display: "flex", justifyContent: "flex-start" }}>
										{obj.typeMessage === "TRAFIC" || obj.typeMessage === "TRAVAUX" ? <div className="logo-trafic-info" style={{ padding: "0.23em" }}><img src={require('./tn-icon-' + obj.typeMessage.toLowerCase() + '.svg')} alt="" /></div> : ""}
										<div style={{ padding: "0.23em" }}><span style={{ background: "black", fontStyle: "italic", paddingRight: "0.25em", paddingLeft: "0.1em" }}><span>{obj.ligne.libelle}</span></span> {content.contenu}</div>
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