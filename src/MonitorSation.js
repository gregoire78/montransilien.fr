import React from 'react';
import axios from 'axios';
import moment from 'moment-timezone';
import Marquee from './Marquee';
import _ from 'lodash';
import { Map, TileLayer } from 'react-leaflet';
import {Helmet} from "react-helmet";
import {API_IP, SSL, THNDER_KEY} from './config';
//import {Helmet} from 'react-helmet';
//import {VelocityComponent} from 'velocity-react';
import 'moment/locale/fr';
import './App.css';
import './big.css';
import './small.css';
import './metrodna.css';

function ListOfTrainLoading() {
    return (
        <div>
            <div className="station-name"><span>Chargement ...</span></div>
            <div id="listetrains">
                {[0,1,2,3,4,5,6].map((train, i) => {
                    return (
                        <div className="train" key={i}>
                            <div className="force-height"></div>
                            <div className="group group-left">
                                <span className="numero-train">ABCD</span>
                                <span className="retard-train">attente</span><br className="after-retard-train"/>
                            </div>
                            <div className="group group-middle">
                                <span className="heure-train">--:--</span>
                            </div>
                            <div className="group">
                                <span className="destination-train">
                                    <span className="transilien symbole light alpha" style={{height: "1em", width: "1em", top: "0.1em", left: "0"}} /> 
                                    <span className="rer symbole light alpha" style={{height: "1em", width: "1em", top: "0.1em", left: "0"}} /> Chargement ...
                                </span>
                                <div className="desserte-train"><p>...</p></div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
  }
  
  function ListOfTrainLoaded(props) {
    let stationHeight;
    let stationElem;
    return (
        <div>
            <div ref={elem => stationElem = elem} className="station-name"><span>{props.data.station.name}</span></div>
            <div ref={(elem) => {
                if(elem){
                    stationHeight = window.innerHeight - elem.clientHeight;
                    if(props.data.trains.length >= 7 && stationHeight <= 200) { stationElem.style.height = stationHeight+"px"; stationElem.style.lineHeight = stationHeight+"px";}
                    else {stationElem.style.height = "100px"; stationElem.style.lineHeight = "100px";}
                }
            }} id="listetrains">
                {props.data.trains.map((train, i) => {
                    return (
                        <div className={"train" + (train.state ? (train.state === "retardé" ? " delayed" : ((train.state === "supprimé") ? " canceled" : "")) : "")} key={i}>
                            <div className="force-height"></div>
                            <div className="group group-left">
                                <span className="numero-train">{train.name}</span>
                                {train.state ? <span className="retard-train">{train.state}</span>: ""}<br className="after-retard-train"/>
                            </div>
                            <div className="group group-middle">
                                <span className="heure-train">{train.expectedDepartureTime}</span>
                            </div>
                            <div className="group" style={{marginRight: '3.2em'}}>
                                <span className="destination-train" title={train.route.long_name}>
                                    <span className={train.route.type + " symbole light alpha"} style={train.route.type !== 'ter' ? {height: "1em", width: "1em", top: "0.1em", left: "0"} : {height: "1em", top: "0.1em", left: "0"}} />
                                    {train.route.type !== 'ter' ? <span className={train.route.type + " alpha ligne" + train.route.line} style={{height: "1em", width: "1em", top: "0.1em", left: "0"}} />: ''}
                                    {" "+train.terminus}
                                </span>
                                <span className="infos-track">{train.nature ? <span className="train-nature"><span style={{fontSize: '0.7em'}}>train<br/></span>{train.nature}</span> : ""}{train.lane !== " " && train.lane !== "BL" ? <span className="voie-train">{train.lane}</span> : ''}</span>
                                <div className="desserte-train" title={train.journey_text}>
                                    {train.journey.length !== 0 ? <Marquee velocity={0.06}>{train.journey_text_html}</Marquee> : <p>{train.journey_text}</p>}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
  }

export default class MonitorStation extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            station: '',
            trains: [],
            currentTime: moment().locale('fr'),
            isLoading: false,
            stationDetails: {}
        };
    }

    getTrainList() {
        return axios.get(`${SSL ? 'https' : 'http'}://${API_IP}/mobi?code_tr3a=${this.props.match.params.tr3a}`)
        .then(response => {
            //console.log(response.data)
            this.setState({trains: response.data.trains, station: response.data.station, isLoading: false})
            document.title = this.state.station.name;
        })
        .catch(error => {
            this.setState({station: error.response.data.station, isLoading: false});
            document.title = this.state.station.name;
        });
    }

    getStationDetails(q) {
        axios.get(`https://data.sncf.com/api/records/1.0/search/?dataset=sncf-gares-et-arrets-transilien-ile-de-france&q="${q}"&rows=1&sort=-gare_non_sncf`)
        .then(response => {
            if (!_.isEmpty(response.data.records)){
                this.setState({stationDetails: response.data.records[0].fields})
            }
        });
    }

    componentWillMount() {
        document.title = "Chargement gare ...";
    }

    componentDidMount() {
        this.setState({isLoading: true});
        this.getTrainList().then(() => this.getStationDetails(this.state.station.uic));
        //this.interval = setInterval(this.timer.bind(this), 2000);
        this.interval = setInterval(this.getTrainList.bind(this), 10000);
        this.intervalTime = setInterval(this.timer.bind(this), 1000);
        //this.getTrainList(this.props.match.params.uic)
    }

    componentWillUnmount() {
        // use intervalId from the state to clear the interval
        clearInterval(this.interval);
        clearInterval(this.intervalTime);
    }
    
    timer() {
        // setState method is used to update the state
        this.setState({ currentTime: moment().locale('fr') });
    }

//<img src="#" alt={train.route.line}/>
    render()  {
        const listOfTrains = this.state.isLoading ? (
            <ListOfTrainLoading />
        ) : (
            <ListOfTrainLoaded data={this.state} />
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
                {listOfTrains}
                <div id="bottomList"></div>
                {_.isEmpty(this.state.stationDetails) ? "" : 
                    <Map
                        zoomControl={false}
                        scrollWheelZoom={false}
                        style={{position: 'fixed',top: '0',left: '0',zIndex: '-100',width: '100%', height: '100%', margin:'auto'}}
                        center={[this.state.stationDetails.coord_gps_wgs84[0], this.state.stationDetails.coord_gps_wgs84[1]]}
                        zoom={18}>
                        <TileLayer
                            attribution="Tiles Courtesy of <a href=&quot;http://www.thunderforest.com&quot; target=&quot;_blank&quot;>Thunderforest</a> - &amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
                            url={"https://{s}.tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png?apikey=" + THNDER_KEY }
                        />
                    </Map>
                }
            </div>
        )
    }
}