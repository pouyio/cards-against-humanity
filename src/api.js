const socket = new WebSocket("ws://localhost:3001/ws");

const actionHandlers = {};

const sendMessage = (action, ...data) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ action, data: data.map(String) }));
  } else {
    setTimeout(() => { sendMessage(action, ...data) }, 100)
  }
};

socket.onmessage = (msg) => {
  const parsedMessage = JSON.parse(msg.data);
  if (actionHandlers[parsedMessage.action]) {
    actionHandlers[parsedMessage.action](parsedMessage.data);
  }
};

const onMessage = (message, cb) => {
  actionHandlers[message] = cb;
};

export { sendMessage, onMessage };
