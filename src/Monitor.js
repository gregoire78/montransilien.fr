import React from 'react';
import axios from 'axios';
import moment from 'moment-timezone';
import Marquee from './Marquee';
//import {VelocityComponent} from 'velocity-react';
import 'moment/locale/fr';
import './App.css';
import './big.css';
import './metrodna.css';

function ListOfTrainLoading() {
    let stationHeight;
    let stationElem;
    return (
        <div>
            <div ref={elem => stationElem = elem} className="station-name"><span>Chargement ...</span></div>
            <div ref={(elem) => {
                if(elem){
                    stationHeight = window.innerHeight - elem.clientHeight;
                    stationElem.style.height = stationHeight+"px";
                    stationElem.style.lineHeight = stationHeight+"px";
                }
            }} id="listetrains">
                {[0,1,2,3,4,5,6].map((train, i) => {
                    return (
                        <div className="train" key={i}>
                            <div className="force-height"></div>
                            <div className="group group-left">
                                <span className="mission-train"></span>
                                <span className="numero-train">ABCD</span>
                                <span className="retard-train">en attente</span><br className="after-retard-train"/>
                            </div>
                            <div className="group group-middle">
                                <span className="heure-train">--:--</span>
                            </div>
                            <div className="group">
                                <span className="destination-train">
                                    <span className="transilien symbole" style={{height: "1em", width: "1em", top: "0.1em", left: "0"}} /> 
                                    <span className="rer symbole" style={{height: "1em", width: "1em", top: "0.1em", left: "0"}} /> Chargement ...
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
            <div ref={elem => stationElem = elem} className="station-name"><span>{props.data.station}</span></div>
            <div ref={(elem) => {
                if(elem){
                    stationHeight = window.innerHeight - elem.clientHeight;
                    if(props.data.trains.length === 7) { stationElem.style.height = stationHeight+"px";stationElem.style.lineHeight = stationHeight+"px";}
                }
            }} id="listetrains">
                {props.data.trains.map((train, i) => {
                    return (
                        <div className={"train" + (train.state ? (train.state === "Retardé" ? " delayed" : ((train.state === "Supprimé") ? " canceled" : "")) : "")} key={i}>
                            <div className="force-height"></div>
                            <div className="group group-left">
                                <span className="numero-train">{train.name}</span>
                                <span className="retard-train">{train.state ? train.state : train.late}</span><br className="after-retard-train"/>
                            </div>
                            <div className="group group-middle">
                                <span className="heure-train">{train.expectedDepartureTime}</span>
                            </div>
                            <div className="group">
                                <span className="destination-train" title={train.route.long_name}>
                                    <span className={train.route.type + " symbole"} style={{height: "1em", width: "1em", top: "0.1em", left: "0"}} />
                                    <span className={train.route.type + " ligne" + train.route.line} style={{height: "1em", width: "1em", top: "0.1em", left: "0"}} />
                                    {" "+train.terminus}
                                </span>
                                <div className="desserte-train" title={train.journey_text}>
                                    {/*<VelocityComponent animation={{left: '-100%'}} axis="x" runOnMount={true} duration={5000} loop={true} >*/}
                                    {train.journey_text ? <Marquee velocity={0.06}>{train.journey_text}</Marquee> : <p>Desserte indisponible</p>}
                                    {/*</VelocityComponent>*/}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
  }

export default class Monitor extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            station: '',
            trains: [],
            currentTime: moment().locale('fr'),
            isLoading: false
        };
    }

    getTrainList() {
        axios.get(`http://localhost:3000?code_uic=${this.props.match.params.uic}`)
        .then(response => {
            //console.log(response.data)
            this.setState({trains: response.data.trains, station: response.data.station, isLoading: false})
            document.title = this.state.station;
        })
        .catch(error => {
            this.setState({station: error.response.data.station, isLoading: false});
            document.title = this.state.station;
        });
    }

    componentWillMount() {
        document.title = "Chargement gare ...";
    }

    componentDidMount() {
        this.setState({isLoading: true});
        this.getTrainList();
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
            <div>
                <div id="heure" title={moment(this.state.currentTime).format('LLLL')}>{moment(this.state.currentTime).format('LT')} <small>{moment(this.state.currentTime).format('ss')}</small></div>
                {listOfTrains}
            </div>
        )
    }
}