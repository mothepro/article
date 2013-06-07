
// Find all releveant elements
var diffTitle = document.querySelector('#diff-title');
var diffImage = document.querySelector('#diff-image');
var diffText = document.querySelector('#diff-text');

var identifier = document.querySelector('#identifier');
var statusDiv = document.querySelector('#status');

var buttonRefresh = document.querySelector('#refresh');
var buttonOpen = document.querySelector('#open');
var buttonLeft = document.querySelector('#left');
var buttonRight = document.querySelector('#right');

var titleState = document.querySelector('#title-state');
var textState = document.querySelector('#text-state');
var imageState = document.querySelector('#image-state');

// Create connection
var socket = new WebSocket("ws://" + window.location.hostname + ':' + 9100);

socket.addEventListener("message", function (msg) {
  msg = JSON.parse(msg.data);
  
  HANDLERS[msg.what].call(null, msg.data);
});

function status(boolean, text) {
  statusDiv.style.borderColor = boolean ? 'tomato' : 'steelblue';
  statusDiv.innerHTML = text;
}

function send(msg) {
  socket.send(JSON.stringify(msg));
}

var dmp = new diff_match_patch();
    dmp.Diff_EditCost = 4;

function diff(a, b) {
  return dmp.diff_prettyHtml( dmp.diff_main(a, b) );
}


var paused = false;
function pause() {
  if (paused) return;
  paused = true;

  titleState.disabled = true;
  textState.disabled = true;
  imageState.disabled = true;
}

function resume() {
  if (!paused) return;
  paused = false;

  titleState.disabled = false;
  textState.disabled = false;
  imageState.disabled = false;
}

var TOTAL = 0;
var INDEX = 0;

var HANDLERS = {
  'ready': function (total) {
    status(false, 'Comparing ...');
    TOTAL = total;
  },

  'compare': function (data) {
    var item = data.item;
    var compare = data.compare;
    status(false, 'Compared result');

    var state = (item.state || '0-0-0').split('-').map(Number);
    titleState.value = state[0];
    textState.value = state[1];
    imageState.value = state[2];

    identifier.innerHTML = item.key;
    buttonOpen.href = item.href;
    INDEX = item.index;

    diffTitle.innerHTML = diff(compare.actual.title || '', compare.expected.title || '');
    diffImage.innerHTML = diff(compare.actual.image || '', compare.expected.image || '');
    diffText.innerHTML = diff(compare.actual.text || '', compare.expected.text || '');

    buttonLeft.style.visibility = (INDEX !== 0) ? 'visible' : 'hidden';
    buttonRight.style.visibility = (INDEX !== (TOTAL - 1)) ? 'visible' : 'hidden';
  },

  'error': function (message) {
    status(true, message);
  },
  
  'resume': function () {
    status(false, 'Compared result');
    resume();
  }
};

titleState.addEventListener('change', updateState);
textState.addEventListener('change', updateState);
imageState.addEventListener('change', updateState);

function updateState() {
  if (paused) return;
  pause();

  status(false, 'Updateing state ...');
  send({
    'what': 'state',
    'data': {
      'index': INDEX,
      'state': titleState.value + '-' + textState.value + '-' + imageState.value
    }
  });  
}

buttonRefresh.addEventListener('click', function () {
  if (paused) return;
  pause();

  status(false, 'Comparing ...');
  send({ 'what': 'load', 'data': INDEX });
});

buttonLeft.addEventListener('click', leftClick);
buttonRight.addEventListener('click', rightClick);

window.addEventListener('keydown', function (evt) {
  switch (evt.keyCode) {
    case 37:
      leftClick();
      break;
    case 39:
      rightClick();
      break;
  }
});

function leftClick() {
  if (INDEX === 0) return;
  if (paused) return;
  pause();

  status(false, 'Comparing ...');
  send({ 'what': 'load', 'data': INDEX - 1 });
}

function rightClick() {
  if (INDEX === (TOTAL - 1)) return;
  if (paused) return;
  pause();

  status(false, 'Comparing ...');
  send({ 'what': 'load', 'data': INDEX + 1 });
}
