import React from 'react';

export default class Footer extends React.Component {
    render() {
        return (
            <footer>
                <p>Made with <span role="img" aria-label="heart" title="love">💖</span> by <a href="https://github.com/gregoire78" target="_blank" rel="noopener noreferrer">gregoire78</a> • Thanks to <a href="http://data.sncf.com/" target="_blank" rel="noopener noreferrer">SNCF open data</a></p>
            </footer>
        )
    }
}