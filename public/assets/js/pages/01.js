//--------------------
// INITIALIZATION
//--------------------

navigator
  .requestMIDIAccess({ sysex: true })
  .then(onSuccess, onFailure);

function onSuccess(midiAccess) {
  handleInputs(midiAccess.inputs.values());
  handleOutputs(midiAccess.outputs.values());
}

function onFailure() {
  console.log('Unable to access MIDI devices');
}

//--------------------
// INPUTS
//--------------------

function handleInputs(inputIterator) {
  const inputs = Array.from(inputIterator);
  inputs.forEach(input => {
    input.onmidimessage = getMessage;
    printInput(input);
  });
}

function printInput(input) {
  $("#inputs").append(`<li>${input.name}</li>`);
}

function getMessage(message) {
  $messages = $("#messages ul");
  $notes = $("#notes ul");
  
  [command, note, velocity] = message.data;
  
  $messages.prepend(`<li>${command}, ${note}, ${velocity}</li>`);
  if (midiCommandList[command] && midiNoteList[note]) {
    $notes.prepend(`<li>${midiCommandList[command]} - ${midiNoteList[note]}</li>`);
  } else {
    $notes.prepend(`<li>UNMAPPED</li>`);
  }
}

//--------------------
// OUTPUTS
//--------------------

function handleOutputs (outputIterator) {
  const outputs = Array.from(outputIterator);
  outputs.forEach(output => {
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
  $(`#send-${output.id}`).click(event => {
    event.preventDefault();
    sendNote(output, 60, 127, 2000);
  });
}

function sendNote(output, note, velocity = 127, duration = 0) {
  output.send([144, note, velocity]);
  output.send([128, note, velocity], window.performance.now() + duration);
}
