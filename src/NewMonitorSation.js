import React from 'react';
import axios from 'axios';
import { Redirect } from 'react-router-dom';
import moment from 'moment-timezone';
import Marquee from './Marquee';
import _ from 'lodash';
import {Icon, LatLngBounds, LatLng} from 'leaflet';
import { Map, TileLayer, Marker, Popup } from 'react-leaflet';
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
                            {train.distance ? <span title={train.distance.lPosReport} onClick={() => props.openModal(train.distance.gps, train.distance.linkMap, train.route.line.color)} className="distance-train">{train.distance.dataToDisplay.distance}</span>: ""}
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
            trainPosition: {lat:'',long:''},
            trainPosLink: "",
            mapTrainLineColor: ""
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

    openModal(trainGps, trainUrl, route) {
        this.setState({modalIsOpen: true, trainPosition: trainGps, trainPosLink: trainUrl, mapTrainLineColor: route });
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
                 
                <Modal
                    isOpen={this.state.modalIsOpen}
                    onRequestClose={this.closeModal}
                    contentLabel="Example Modal"
                >

                    <a href={this.state.trainPosLink} target="blank" style={{color: 'black', fontSize: '10px', position: "absolute", zIndex: "2"}}>sncf position en temps réél</a>
                    
                    {_.isEmpty(this.state.station) ? "" :
                    <Map
                        zoomControl={true}
                        scrollWheelZoom={true}
                        style={{width: '100%', height: '100%', zIndex: "1"}}
                        center={new LatLng(this.state.trainPosition.lat, this.state.trainPosition.long)}
                        bounds={new LatLngBounds(
                            new LatLng(this.state.trainPosition.lat, this.state.trainPosition.long),
                            new LatLng(this.state.station.gps.lat, this.state.station.gps.long)
                        )}
                        zoom={14}>
                        <TileLayer
                            attribution="Tiles Courtesy of <a href=&quot;http://www.thunderforest.com&quot; target=&quot;_blank&quot;>Thunderforest</a> - &amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
                            url={"https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=" + THNDER_KEY }
                        />
                        {/*<TileLayer
                            attribution="sncf transport map"
                            url={"https://gis-de-c.haf.as/hafas-tiles/v1/sncf_osm/1/{z}/{x}/{y}.png" }
                        />*/}
                        <TileLayer
                            attribution=""
                            url={"https://gis-de-c.haf.as/hafas-tiles/sncf_tracks/1/{z}/{x}/{y}.png" }
                        />
                        <Marker position={new LatLng(this.state.trainPosition.lat, this.state.trainPosition.long)} icon={new Icon({
                            iconUrl: `data:image/svg+xml;base64,
                            ${btoa(`<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 92.82 144.01" width="34" height="52.75">
                                        <g transform="translate(-49.735701,-74.162247)">
                                        <g transform="matrix(0.26458333,0,0,0.26458333,48.148201,72.521831)" style="stroke:#000000;stroke-width:3;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1">
                                            <path d="m 182.9,551.7 c 0,0.1 0.2,0.3 0.2,0.3 0,0 175.2,-269 175.2,-357.4 C 358.3,64.5 269.5,7.9 182.9,7.7 96.3,7.9 7.5,64.5 7.5,194.6 7.5,283 182.8,552 182.8,552 Z" style="fill:#${this.state.mapTrainLineColor};stroke:#000000;stroke-width:3;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"/>
                                        </g>
                                        <g transform="matrix(0.40647689,0,0,0.40647689,63.355619,90.623017)" style="fill: #7d3939;fill-opacity:1;stroke:#000000;stroke-width:1.95275557;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1;">
                                            <g style="fill:#fcfcfc;fill-opacity:1;stroke:#000000;stroke-width:1.95275557;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1;">
                                                <path d="m 148.945,80.357 c 0,37.662 -30.997,68.62 -68.75,68.62 -38.051,0 -69.232,-30.782 -69.232,-68.62 0,-38.175 31.181,-69.543 69.232,-69.543 37.754,0 68.75,31.571 68.75,69.543 m 11.026,0 C 159.971,36.003 122.778,0 80.195,0 35.956,0 -0.029,36.003 -0.029,80.357 -0.029,124.18 35.956,160 80.196,160 c 44.185,0 79.775,-35.404 79.775,-79.643" style="fill:#fcfcfc;fill-opacity:1;stroke:#000000;stroke-width:1.95275557;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"/>
                                                <path d="m 117.433,126.129 -14.751,-16.355 c 0.341,-0.23 0.664,-0.459 0.905,-0.704 2.745,-2.19 5.279,-5.581 7.131,-10.834 2.587,-7.336 4.43,-13.901 4.932,-21.983 0.689,-9.961 -3.415,-25.444 -6.133,-32.659 l -0.948,-2.56 c -0.586,-1.613 -2.815,-5.06 -6.794,-9.179 -3.404,-3.536 -6.68,-3.804 -11.671,-3.804 H 69.845 c -4.99,0 -8.266,0.268 -11.675,3.804 -3.965,4.111 -6.209,7.565 -6.795,9.179 l -0.941,2.564 c -2.726,7.21 -6.839,22.693 -6.141,32.66 0.51,8.064 2.334,14.611 4.924,21.978 1.865,5.253 4.406,8.644 7.147,10.834 0.251,0.241 0.57,0.474 0.913,0.698 l -14.759,16.361 c -1.196,1.325 -1.196,3.495 0,4.817 1.195,1.325 3.143,1.325 4.331,0 l 5.097,-5.652 h 56.059 l 5.083,5.652 c 1.207,1.325 3.147,1.325 4.346,0 1.193,-1.322 1.193,-3.492 -10e-4,-4.817 z M 52.248,70.268 c -1.124,-2.927 1.925,-22.044 3.966,-24.811 h 47.021 c 1.953,2.378 6.021,22.148 4.352,24.811 z m 5.824,48.238 5.434,-6.035 c 2.646,0.606 5.083,0.621 6.863,0.621 h 19.207 c 1.778,0 4.218,-0.015 6.858,-0.621 l 5.447,6.035 z M 57.147,96.249 c 0,-2.691 2.188,-4.873 4.881,-4.873 2.691,0 4.888,2.182 4.888,4.873 0,2.683 -2.197,4.871 -4.888,4.871 -2.693,0 -4.881,-2.188 -4.881,-4.871 z m 40.401,4.757 c -2.694,0 -4.885,-2.193 -4.885,-4.878 0,-2.687 2.191,-4.864 4.885,-4.864 2.698,0 4.881,2.178 4.881,4.864 0.001,2.685 -2.182,4.878 -4.881,4.878 z" style="fill:#fcfcfc;fill-opacity:1;stroke:#000000;stroke-width:1.95275557;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"/>
                                            </g>
                                        </g>
                                        </g>
                                    </svg>`
                            )}`,
                            iconAnchor: [17, 52.75]
                        })}>
                        </Marker>
                        <Marker position={new LatLng(this.state.station.gps.lat, this.state.station.gps.long)} icon={new Icon({
                            iconUrl: "https://sncf-maps.hafas.de/hafas-res/img/livemap/icons/station_normalstate.png",
                            iconAnchor: [8, 8],
                            popupAnchor: [0, 0],
                            iconSize: [16,16]
                        })}>
                            <Popup>
                                <span>
                                    <b>{this.state.station.name}</b>
                                </span>
                            </Popup>
                        </Marker>
                    </Map>}

                </Modal>
                {this.state.error === true ? <Redirect to="/" /> : ""}
            </div>
        )
    }
}