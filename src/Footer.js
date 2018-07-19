import React from 'react';

export default class Footer extends React.Component {
	render() {
		return (
			<footer>
				<p>Fait avec <span role="img" aria-label="heart" title="amour">❤</span> par <a href="https://github.com/gregoire78" target="_blank" rel="noopener noreferrer">gregoire78</a> <span className="dot-separator">•</span> Merci à <a href="http://data.sncf.com/" target="_blank" rel="noopener noreferrer">SNCF open data</a></p>
			</footer>
		)
	}
}