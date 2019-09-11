(async () => {
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
      input.addListener("noteon", "all", playNote);
      input.addListener("noteoff", "all", stopNote);
      input.addListener("controlchange", "all", bindControlKnobs);
    });
  }

  function bindControlKnobs(event) {
    const knobNumber = event.controller.number;
    if (knobs[knobNumber]){
      knobs[knobNumber](event.value);
    }
  }

  function playNote(event) {
    freq = noteFreqs[event.note.name + event.note.octave];
    nodes["oscillatorNode"].node.frequency.setValueAtTime(freq, audioContext.currentTime);
    nodes["synthMuteNode"].node.gain.setValueAtTime(1, audioContext.currentTime);
  }

  function stopNote() {
    nodes["synthMuteNode"].node.gain.setValueAtTime(0, audioContext.currentTime);
  }

  const knobs = {
    1: (value) => {
      getNode("synthGainNode").gain.setValueAtTime(midiToGain(value), audioContext.currentTime);
      setSliderValue("synthGain", value);
    },
    2: (value) => {
      getNode("synthFilterNode").frequency.setValueAtTime(midiToFilter(value), audioContext.currentTime);
      setSliderValue("synthFilter", value);
    },
    4: (value) => {
      getNode("masterGainNode").gain.setValueAtTime(midiToGain(value), audioContext.currentTime);
      setSliderValue("masterGain", value);
    },
    5: (value) => {
      getNode("microphoneGainNode").gain.setValueAtTime(midiToGain(value), audioContext.currentTime);
      setSliderValue("micGain", value);
    },
    6: (value) => {
      getNode("microphoneFilterNode").frequency.setValueAtTime(midiToFilter(value), audioContext.currentTime);
      setSliderValue("micFilter", value);
    },
  }


  //--------------------
  // AUDIO INITIALIZATION
  //--------------------

  // Create context and nodes
  const audioContext = new AudioContext();

  const microphonePipeline = await createMicrophonePipeline();
  const synthPipeline = createSynthPipeline();

  const nodes = {
    ...microphonePipeline,
    ...synthPipeline,
    "masterGainNode": {
      node: createGainNode(),
      connect_to: "output"
    }
  };

  connectNodes(nodes);

  function connectNodes(nodes) {
    Object.keys(nodes).forEach(function(key) {
      const destination =
        nodes[key].connect_to === "output" ?
        audioContext.destination :
        getNode(nodes[key].connect_to);
      
      getNode(key).connect(destination);
    });
  }
  
  // Synth node pipeline

  function createSynthPipeline() {
    return {
      "oscillatorNode": { node: createOscillatorNode(), connect_to: "synthMuteNode" },
      "synthMuteNode": { node: createGainNode(), connect_to: "synthGainNode" },
      "synthGainNode": { node: createGainNode(), connect_to: "synthFilterNode" },
      "synthFilterNode": { node: createFilterNode(), connect_to: "masterGainNode" }
    };
  }

  // Microphone node pipeline

  async function createMicrophonePipeline() {
    return {
      "microphoneNode": { node: await createMicrophoneNode(), connect_to: "microphoneGainNode" },
      "microphoneGainNode": { node: createGainNode(), connect_to: "microphoneFilterNode" },
      "microphoneFilterNode": { node: createFilterNode(), connect_to: "masterGainNode" }
    }
  }

  async function createMicrophoneNode() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return audioContext.createMediaStreamSource(stream);
  }


  // Helper functions

  const midiToGain = (value) => value / 127;
  const midiToFilter = (value) => (value * 5000) / 127

  function createOscillatorNode() {
    const oscillatorNode = audioContext.createOscillator();
    oscillatorNode.type = "sawtooth";
    return oscillatorNode;
  }

  function createGainNode() {
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    return gainNode;
  }

  function createFilterNode() {
    const filterNode = audioContext.createBiquadFilter();
    filterNode.frequency.setValueAtTime(6000, audioContext.currentTime);
    filterNode.type = "lowpass";
    return filterNode;
  }

  function getNode(nodeName) {
    return nodes[nodeName].node || null;
  }


  //--------------------
  // UI STUFF
  //--------------------

  $("body").click(() => {
    nodes["oscillatorNode"].node.start();
    $("body").off();
  });

  function setSliderValue(id, value) {
    $(`#${id}`).val(value);
  }
})();
