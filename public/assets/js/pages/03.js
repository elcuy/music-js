//--------------------
// MIDI INITIALIZATION
//--------------------

WebMidi.enable(handleEnable, { sysex: true });

function handleEnable(err) {
  if (err) {
    console.log("WebMidi could not be enabled.", err);
  } else {
    console.log("WebMidi enabled!");
    getDevices();
  }
}

function getDevices() {
  WebMidi.inputs.forEach(input => {
    input.addListener("controlchange", "all", bindKnobs);
  });
}

function bindKnobs(event) {
  switch (event.controller.number) {
    case 1: setGain(event.value); break;
    case 2: setFreq(event.value); break;
  }
}


//--------------------
// AUDIO INITIALIZATION
//--------------------

// Create context and nodes
const audioContext = new AudioContext();

const oscillatorNode = createOscillator();
const gainNode = createGain();
const analyserNode = audioContext.createAnalyser();

// Connect nodes
oscillatorNode.connect(gainNode);
gainNode.connect(analyserNode);
analyserNode.connect(audioContext.destination);

// Helper functions
function createOscillator() {
  const oscillatorNode = audioContext.createOscillator();
  oscillatorNode.type = "sine";
  return oscillatorNode;
}

function createGain() {
  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  return gainNode;
}

function setGain(value) {
  const gain = value / 127
  gainNode.gain.setValueAtTime(gain, audioContext.currentTime);
}

function setFreq(value) {
  const freq = (value * 2000) / 127;
  oscillatorNode.frequency.setValueAtTime(freq, audioContext.currentTime);
}


//--------------------
// UI STUFF
//--------------------

$("body").click(() => {
  drawOscilloscope();
	updateWaveForm();
  oscillatorNode.start();
  $("body").off();
});

$(".set-type").click(event => {
  $(".set-type").removeClass("button-primary");
  oscillatorNode.type = event.target.dataset.type;
  $(event.target).addClass("button-primary");
});


//--------------------
// GRAPH
//--------------------

const waveform = new Float32Array(analyserNode.frequencyBinCount);
analyserNode.getFloatTimeDomainData(waveform);

function updateWaveForm() {
  requestAnimationFrame(updateWaveForm);
  analyserNode.getFloatTimeDomainData(waveform);
}

function drawOscilloscope() {
	requestAnimationFrame(drawOscilloscope);

	const scopeCanvas = document.getElementById('oscilloscope');
	const scopeContext = scopeCanvas.getContext('2d');

	scopeCanvas.width = waveform.length;
	scopeCanvas.height = 500;

	scopeContext.clearRect(0, 0, scopeCanvas.width, scopeCanvas.height);
  scopeContext.beginPath();

	for(let i = 0; i < waveform.length; i++) {
    const x = i;
    const y = ( 0.5 + (waveform[i] / 2) ) * scopeCanvas.height;
		
		if(i == 0) {
      scopeContext.moveTo(x, y);
    } else {
      scopeContext.lineTo(x, y);
    }
  }

	scopeContext.strokeStyle= '#ffffff';
	scopeContext.lineWidth = 4;
	scopeContext.stroke();
}
