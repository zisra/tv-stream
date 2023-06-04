const streamSelectElement = document.getElementById(
	'stream-select'
) as HTMLSelectElement;
const countrySelectElement = document.getElementById(
	'country-select'
) as HTMLSelectElement;
const videoElement = document.getElementById('video') as HTMLVideoElement;

import Hls from 'hls.js';

import './style.css';

fetch('https://api.github.com/repos/iptv-org/iptv/contents/streams').then(
	async (response) => {
		const countries: {
			name: string;
			path: string;
		}[] = await response.json();
		countries.forEach(({ name, path }) => {
			const option = new Option(name.replace('.m3u', ''), path);
			countrySelectElement.add(option);
		});
	}
);

countrySelectElement.addEventListener('change', () => {
	fetch(
		`https://raw.githubusercontent.com/iptv-org/iptv/master/${countrySelectElement.value}`
	).then(async (response) => {
		const streams = await response.text();
		const lines = streams.split('\n');
		const streamOptions = [];

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (line.startsWith('#EXTINF')) {
				const title = line.split(',')[1];
				const link = lines[i + 1].trim();
				streamOptions.push({ title, link });
				i++;
			}
		}

		streamSelectElement.innerHTML = '<option>Select stream</option>';

		streamOptions.forEach(({ title, link }) => {
			const option = new Option(title, link);
			streamSelectElement.add(option);
		});

		streamSelectElement.style.display = 'block';
	});

	streamSelectElement.addEventListener('change', (event) => {
		event.preventDefault();
		const selectedLink = streamSelectElement.value;
		if (Hls.isSupported()) {
			const hls = new Hls();
			hls.loadSource(selectedLink);
			hls.attachMedia(videoElement);
			hls.on(Hls.Events.MANIFEST_PARSED, () => {
				videoElement.play();
			});
		} else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
			videoElement.src = selectedLink;
			videoElement.addEventListener('loadedmetadata', () => {
				videoElement.play();
			});
		}
	});
});
