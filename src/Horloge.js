import React from 'react';
import moment from 'moment-timezone';
import 'moment/locale/fr';

export default class TrainMapRT extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentTime: moment().locale('fr')
        };
    }

    componentDidMount() {
        this.intervalTime = setInterval(this.timer.bind(this), 1000);
    }

    componentWillUnmount() {
        clearInterval(this.intervalTime);
    }

    timer() {
        // setState method is used to update the state
        this.setState({ currentTime: moment().locale('fr') });
    }

    render() {
        return(
            <div id="heure" className="voie" title={moment(this.state.currentTime).format('LLLL')}>{moment(this.state.currentTime).format('LT')} <small>{moment(this.state.currentTime).format('ss')}</small></div>
        )
    }
}