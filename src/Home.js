import React from 'react';
import axios from 'axios';
import './App.css';

export default class Home extends React.Component {
    constructor (props) {
        super(props);
        this.state = {valueSearch: ''};
        this.handleChange = this.handleChange.bind(this);
    }

    getDataAutocomplete(value) {
        /**
         * https://robwu.nl/cors-anywhere.html
         * https://github.com/Rob--W/cors-anywhere/
         * https://medium.com/netscape/hacking-it-out-when-cors-wont-let-you-be-great-35f6206cc646
         */
        axios.get(`https://cors-anywhere.herokuapp.com/https://transilien.mobi/getProchainTrainAutocomplete?value=${encodeURI(value)}`)
        .then(response => {
            console.log(response.data)
           // this.setState({trains: response.data.trains, station: response.data.station, isLoading: false})
        })
        .catch(error => {
            //console.log("error")
        });
    }

    componentDidMount() {
        /*var xhr = new XMLHttpRequest();
        xhr.open("GET", "https://cors-escape.herokuapp.com/https://transilien.mobi/getProchainTrainAutocomplete?value=cloud");*/
        document.body.style.backgroundColor = "#252438";
    }

    handleChange (e) {
        this.getDataAutocomplete(e.target.value)
        this.setState({valueSearch: e.target.value});
    }

    render() {
        return (
            <div id="Home">
                <h1><img src="./favicon144.png" height="50px" alt="logo train" /><span>Mon Transilien - Monitoring</span></h1>
                <div className="search">
                    <input onChange={this.handleChange} type="text" />
                </div>
            </div>
        )
    }
}