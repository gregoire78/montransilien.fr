import React from 'react';
import axios from 'axios';
import { Redirect } from 'react-router-dom';
import moment from 'moment-timezone';
import Marquee from './Marquee';
import MapTrain from './TrainMapRT';
import _ from 'lodash';
import { Map, TileLayer} from 'react-leaflet';
import {Helmet} from "react-helmet";
import {API_IP, SSL, THNDER_KEY} from './config';
import Loader from 'react-loaders';
import Modal from 'react-modal';
//import {Helmet} from 'react-helmet';
//import {VelocityComponent} from 'velocity-react';
import 'moment/locale/fr';
import './App.css';
import './big.css';
import './small.css';
import './metrodna.css';

let stationHeight;
let stationElem;

function ListOfTrainLoaded(props) {
    return (
        <div ref={(elem) => {
            if(elem){
                stationHeight = window.innerHeight - elem.clientHeight;
                if(props.data.trains.length >= 7 && stationHeight <= 95) { stationElem.style.height = stationHeight+"px"; stationElem.style.lineHeight = stationHeight+"px";}
                else {stationElem.style.height = "50px"; stationElem.style.lineHeight = "50px";}
            }
        }} id="listetrains">
            {props.data.trains.map((train, i) => {
                return (
                    <div className={"train" + (train.state ? (train.state === "retardé" ? " delayed" : ((train.state === "supprimé") ? " canceled" : "")) : "")} key={i}>
                        <div className="force-height"></div>
                        <div className="group group-left">
                            <span className="numero-train">{train.name}</span>
                            {train.state ? <span className="retard-train">{train.state}</span>: ""}
                            {train.distance ? <span title={train.distance.lPosReport} onClick={() => props.openModal(train.number)} className="distance-train">{train.distance.dataToDisplay.distance}</span>: ""}
                            <br className="after-retard-train"/>
                        </div>
                        <div className="group group-middle">
                            <span className="heure-train">{train.expectedDepartureTime}</span>
                        </div>
                        <div className="group">
                            <span className="destination-train" title={train.route.name}>
                                <span className={train.route.line.type + " symbole light alpha"} style={train.route.line.type !== 'ter' ? {height: "1em", width: "1em", top: "0.1em", left: "0"} : {height: "1em", top: "0.1em", left: "0"}} />
                                {train.route.line.type !== 'ter' ? <span className={train.route.line.type + " alpha ligne" + train.route.line.code} style={{height: "1em", width: "1em", top: "0.1em", left: "0"}} />: ''}
                                {" "+train.terminus}
                            </span>
                            <span className="infos-track">{train.nature ? <span className="train-nature"><span style={{fontSize: '0.7em'}}>train<br/></span>{train.nature}</span> : ""}{train.lane !== " " ? <span className="voie-train">{train.lane}</span> : ''}</span>
                            <div className="desserte-train" title={train.journey_text}>
                                {train.journey_redux.length !== 0 ? <Marquee velocity={0.06}>{train.journey_text_html}</Marquee> : <p>{train.journey_text}</p>}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    );
}

// Make sure to bind modal to your appElement (http://reactcommunity.org/react-modal/accessibility/)
Modal.setAppElement('body')

export default class MonitorStation extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            station: {},
            trains: [],
            trafic: [],
            currentTime: moment().locale('fr'),
            isLoading: false,
            error: false,

            modalIsOpen: false,
            train: {}
        };
        this.tr3a = this.props.match.params.tr3a;
        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
    }

    getTrainList() {
        return axios.get(`${SSL ? 'https' : 'http'}://${API_IP}/departures?uic=${this.state.station.uic}&lat=${this.state.station.gps.lat}&long=${this.state.station.gps.long}&tr3a=${this.tr3a}`)
        .then(response => {
            //console.log(response.data)
            this.setState({trains: response.data, isLoading: false})
        })
        .catch(error => {
            this.setState({error: true})
        });
    }

    getStation() {
        return axios.get(`${SSL ? 'https' : 'http'}://${API_IP}/station/${this.tr3a}`)
        .then(response => {
            this.setState({station: response.data});
        })
        .catch(error => {
            this.setState({error: true})
        });
    }

    getTrafic() {
        return axios.get(`${SSL ? 'https' : 'http'}://${API_IP}/trafic`)
        .then(response => {
            this.setState({trafic: response.data})
        });
    }

    componentWillMount() {
        document.title = "Chargement gare ...";
    }

    componentDidMount() {
        this.setState({isLoading: true});

        this.getStation()
        .then(() => Promise.all([this.getTrainList(), this.getTrafic()]))
        .then(() => {
            document.title = this.state.station.name;
            if(!this.state.error) {
                this.interval = setInterval(this.getTrainList.bind(this), 15000);
                this.intervalTrafic = setInterval(this.getTrafic.bind(this), 60000);
            }
        })
        .catch(error => {});
        this.intervalTime = setInterval(this.timer.bind(this), 1000);
    }

    componentWillUnmount() {
        // use intervalId from the state to clear the interval
        clearInterval(this.interval);
        clearInterval(this.intervalTime);
        clearInterval(this.intervalTrafic);
    }
    
    timer() {
        // setState method is used to update the state
        this.setState({ currentTime: moment().locale('fr') });
    }

    openModal(number) {
        this.setState({modalIsOpen: true, train: _.find(this.state.trains, ['number', number])})
    }

    closeModal() {
        this.setState({modalIsOpen: false});
    }

//<img src="#" alt={train.route.line}/>
    render()  {
        const listOfTrains = this.state.isLoading ? (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                height: '100%',
                alignItems: 'center',
                backgroundColor: 'rgba(25, 25, 39, 0.88)',
            }}>
                <Loader type="pacman" active style={{height: "50px"}} />
            </div>
        ) : (
            <ListOfTrainLoaded data={this.state} openModal={this.openModal}/>
        )
        return (
            <div id="listView">
                <Helmet>
                    <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/leaflet.css"/>
                </Helmet>
                {/*<Helmet defer={true} >
                    <link rel="stylesheet" type="text/css" href="dark.css" />
                </Helmet>*/}
                <div id="heure" className="voie" title={moment(this.state.currentTime).format('LLLL')}>{moment(this.state.currentTime).format('LT')} <small>{moment(this.state.currentTime).format('ss')}</small></div>
                <div ref={elem => stationElem = elem} className="station-name"><span>{this.state.station.name}</span></div>
                {listOfTrains}
                <div id="bottomList"></div>
                {_.isEmpty(this.state.station) ? "" : 
                    <Map
                        zoomControl={false}
                        scrollWheelZoom={false}
                        style={{position: 'fixed',top: '0',left: '0',zIndex: '-100',width: '100%', height: '100%', margin:'auto'}}
                        center={[this.state.station.gps.lat, this.state.station.gps.long]}
                        zoom={18}>
                        <TileLayer
                            attribution="Tiles Courtesy of <a href=&quot;http://www.thunderforest.com&quot; target=&quot;_blank&quot;>Thunderforest</a> - &amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
                            url={"https://{s}.tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png?apikey=" + THNDER_KEY }
                        />
                    </Map>
                }
                {_.isEmpty(this.state.train) ? "" :
                    <Modal
                        isOpen={this.state.modalIsOpen}
                        onRequestClose={this.closeModal}
                        contentLabel="Example Modal">
                        <a href={this.state.train.distance.linkMap} target="blank" style={{color: 'black', fontSize: '10px', position: "absolute", zIndex: "2"}}>sncf position en temps réél {this.state.train.distance.lPosReport}</a> 
                        <MapTrain train={this.state.train} station={this.state.station} />
                    </Modal>
                }
                {this.state.error === true ? <Redirect to="/" /> : ""}
            </div>
        )
    }
}