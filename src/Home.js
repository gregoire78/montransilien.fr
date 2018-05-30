import React from 'react';
import { Link } from 'react-router-dom'
import axios from 'axios';
import _ from 'lodash';
import './App.css';

/**
 * https://reactjs.org/docs/forms.html#controlled-components
 * https://codesandbox.io/s/3vw2onz526          https://www.peterbe.com/plog/how-to-throttle-and-debounce-an-autocomplete-input-in-react
 * https://stackoverflow.com/questions/23123138/perform-debounce-in-react-js
 */
export class SearchBox extends React.Component {
    constructor (props) {
        super(props);
        this.state = { query: this.props.query };
        this.handleChange = this.handleChange.bind(this);
    }

    componentWillMount () {
        this.handleSearchDebounced = _.debounce(() => {
            this.props.handleSearch.apply(this, [this.state.query]);
        }, 500);
    }

    handleChange (event) {
        this.setState({query: event.target.value});
        this.handleSearchDebounced();
    }

    render () {
        return (
            <input type="search" placeholder={this.props.placeholder} value={this.state.query} onChange={this.handleChange} />
        );
    }
}

export default class Home extends React.Component {
    constructor (props) {
        super(props);
        this.state = {result: "", stations: []};
        this.handleSearch = this.handleSearch.bind(this);
    }

    getDataAutocomplete(value) {
        /**
         * https://robwu.nl/cors-anywhere.html
         * https://github.com/Rob--W/cors-anywhere/
         * https://medium.com/netscape/hacking-it-out-when-cors-wont-let-you-be-great-35f6206cc646
         */
        axios.get(`https://stormy-atoll-29313.herokuapp.com/https://transilien.mobi/getProchainTrainAutocomplete?value=${encodeURI(value)}`)
        .then(response => {
            if(!response.data.error)
                this.setState({stations: response.data})
            else
                this.setState({stations: []})
        })
        .catch(error => {
        });
    }

    componentDidMount() {
        /*var xhr = new XMLHttpRequest();
        xhr.open("GET", "https://cors-escape.herokuapp.com/https://transilien.mobi/getProchainTrainAutocomplete?value=cloud");*/
        document.body.style.backgroundColor = "#252438";
    }

    componentWillUnmount() {
        document.body.style.backgroundColor = null;
    }

    handleSearch(query) {
        this.getDataAutocomplete(query)
        this.setState({result: query});
    }



    render() {
        return (
            <div id="Home">
                <h1><img src="./favicon144.png" alt="logo train" /><span>Mon Transilien</span></h1>
                <div className="search">
                    <SearchBox query={this.state.result} placeholder="Rechercher une gare" handleSearch={this.handleSearch} />
                    <div>
                        {this.state.stations.map((v,i) => {
                            return (
                             <p key={i}style={{marginTop: ".3em"}}>
                                <Link to={v.codeTR3A} ><LignesSymboles lignes={v.lignes}/> {v.name}</Link>
                            </p>
                            )
                        })}
                    </div>
                </div>
            </div>
        )
    }
}

function LignesSymboles(props) {
    return props.lignes.map((ligne, i) => {
        return (
            <span key={i} className={(ligne.type === "TRAIN" ? "transilien" : "rer") + " alpha ligne" + ligne.idLigne} style={{height: "1em", width: "1em", top: "0.1em", left: "0"}} />
        )
    })
}