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
        axios.get(`https://transilien.mobi/getProchainTrainAutocomplete?value=${encodeURI(value)}`, { crossdomain: true })
        .then(response => {
            console.log(response.data)
           // this.setState({trains: response.data.trains, station: response.data.station, isLoading: false})
        })
        .catch(error => {
            console.log("error")
        });
    }

    handleChange (e) {
        console.log(e.target.value)
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