var advancedEditor, authorship, basicEditor, cursorManager, name = "", socket, _, msgcount, users;

//name = "Guest" + parseInt(Math.random()*10000);
console.log({ name });

// initialize message counter
msgcount = 0;

// initialize local users
users = [];

function initial_connect() {
  // try to connect
  console.log("Connecting...");
  socket = io.connect();

  // attach event listeners
  socket.on("new_client", new_client);
  socket.on("name_change", update_name);
  socket.on("the_others", receive_others);
  socket.on("drop_client", drop_client);
  socket.on("disconnect", disconnect);
  socket.on("recv_delta", recv_delta);
}

function recv_delta(data) {
  advancedEditor.updateContents(data);
}

function send_pos() {
  socket.emit("send_pos", {pos: 0});
}

function disconnect() {
  console.log("Disconnected");
  name = "";
}

function drop_client(data) {
  console.log("<span class='uname' style='color: "+users[data.name].color+";'>"+data.name + "</span> has disconnected.");
  delete users[data.name];
}

function receive_others(data) {
  var people = data["others"];
  for (var i in people) {
    var person = people[i];
    userInit(person.name, person.color);
  }
}

function new_client(data) {
  // if the new client is us
  if (name == "")
    connected(data);
  else
    update_name(data);
}

function connected(data) {
  // client is connected successfully
  console.log("Connected!");

  // update name and color info
  update_name(data);
  color = data.color;

  // create the cursor
  cursorManager.setCursor("advanced", 0, name, users[name].color);
}

function userInit(username, user_col) {
  // this is called to add a user to the array with their
  // color and id saved
  users[username] = {color: user_col};

  // display a status message
  console.log("<span class='uname' style='color: "+users[username].color+";'>"+username+"</span> has connected.");
}

function updateUser(oldname, newname) {
  // move the data in the users array
  users[newname] = users[oldname];
  delete users[oldname];

  // display a status message
  console.log(""+oldname+" is now known as <span class='uname' style='color: "+users[newname].color+";'>"+newname+"</b>");
}

function update_name(data) {
  if (data.oldname in users)
    updateUser(data.oldname, data.name);
  else
    userInit(data.name, data.color);

  // if the old name was us (or name isn't set), update our name onscreen
  if (data.oldname == name || name == "") {
    // set this client's name from the server
    name = data.name;
    console.log(name);

    // update the cursor
    cursorManager.removeCursor("advanced");
    cursorManager.setCursor("advanced", 0, name, users[name].color);
  }
}

_ = Quill.require('lodash');

advancedEditor = new Quill('.advanced-wrapper .editor-container', {
  modules: {
    'authorship': {
      authorId: 'advanced',
      enabled: true
    },
    'toolbar': {
      container: '.advanced-wrapper .toolbar-container'
    },
    'link-tooltip': true,
    'image-tooltip': true,
    'multi-cursor': true
  },
  styles: false,
  theme: 'snow'
});

cursorManager = advancedEditor.getModule('multi-cursor');

advancedEditor.on('selection-change', function(range) {
  return console.info('advanced', 'selection', range);
});

advancedEditor.on('text-change', function(delta, source) {
  var sourceDelta, targetDelta;

  if (source === 'api') return;

  socket.emit("send_delta", delta);
});

initial_connect();
