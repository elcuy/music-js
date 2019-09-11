//--------------------
// INITIALIZATION
//--------------------

WebMidi.enable(handleEnable, { sysex: true });

function handleEnable(error) {
  if (error) {
    console.log("WebMidi could not be enabled.", error);
  } else {
    console.log("WebMidi enabled!");
    getDevices();
  }
}

function getDevices() {
  handleInputs();
  handleOutputs();
}

//--------------------
// INPUTS
//--------------------

function handleInputs() {
  WebMidi.inputs.forEach(input => {
    input.addListener("noteon", "all", getMessage);
    input.addListener("noteoff", "all", getMessage);
    input.addListener("pitchbend", "all", getMessage);
    input.addListener("controlchange", "all", getMessage);
    printInput(input);
  });
}

function printInput(input) {
  $("#inputs").append(`<li>${input.name}</li>`);
}

function getMessage(event) {
  $messages = $("#messages ul");
  $notes = $("#notes ul");

  [command, note, velocity] = event.data;

  $messages.prepend(`<li>${command}, ${note}, ${velocity}</li>`);

  const actions = {
    'noteon': `<li>NOTE ON: ${JSON.stringify(event.note)}</li>`,
    'noteoff': `<li>NOTE OFF: ${JSON.stringify(event.note)}</li>`,
    'pitchbend': `<li>PITCH BEND: ${event.value}</li>`,
    'controlchange': `<li>CC: ${JSON.stringify(event.controller)} - ${event.value}</li>`
  };
  $notes.prepend(actions[event.type]);
}

//--------------------
// OUTPUTS
//--------------------

function handleOutputs() {
  WebMidi.outputs.forEach(output => {
    printOutput(output);
    bindTestButton(output);
  });
}

function printOutput(output) {
  $("#outputs").append(`
    <li>
      ${output.name}
      <a href="#" id="send-${output.id}">
        Test
      </a>
    </li>
  `);
}

function bindTestButton(output) {
  $(`#send-${output.id}`).click(e => {
    e.preventDefault();
    output.playNote("C4", 1, { duration: 2000, velocity: 1 });
  });
}
