import React from 'react';
import axios from 'axios';
import moment from 'moment-timezone';
import 'moment/locale/fr';
import './App.css';
import './big.css';

export default class Monitor extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            station: '',
            trains: [],
            currentTime: moment().locale('fr')
        };
    }

    getTrainList() {
        axios.get(`http://localhost:3000?code_uic=${this.props.match.params.uic}`)
        .then(response => {
            //console.log(response.data)
            this.setState({trains: response.data.trains, station: response.data.station})
            document.title = this.state.station;
        })
        .catch(error => {
            console.error(error);
        });
    }

    componentDidMount() {
        //this.interval = setInterval(this.timer.bind(this), 2000);
        this.interval = setInterval(this.getTrainList.bind(this), 5000);
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
        return (
            <div>
                <b>{this.state.station}</b>
                <div id="heure" title={moment(this.state.currentTime).format('LLLL')}>{moment(this.state.currentTime).format('LT')} <small>{moment(this.state.currentTime).format('ss')}</small></div>
                <div id="listetrains">
                    {this.state.trains.map((train, i) => {
                        return (
                            <div className="train" key={i}>
                                <div className="force-height"></div>
                                <div className="group group-left">
                                    <span className="mission-train">{train.name}</span>
                                    <span className="numero-train">{train.number}</span>
                                    <span className="retard-train">{train.state ? train.state : train.late}</span><br className="after-retard-train"/>
                                </div>
                                <div className="group group-middle">
                                    <span className="heure-train">{train.expectedDepartureTime}</span>
                                </div>
                                <div className="group">
                                    <span className="destination-train">{train.terminus}</span>
                                    <div className="desserte-train" title={train.journey_text}><marquee behavior="scroll" scrollamount="5">{train.journey_text}</marquee></div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }
}