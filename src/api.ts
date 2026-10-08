const BASE_URI = window.location.host;
const WS_PROTOCOL = window.location.protocol === "https:" ? "wss" : "ws";

export const socket = new WebSocket(`${WS_PROTOCOL}://${BASE_URI}/ws`);
const API_ENDPOINT = window.location.origin;

const actionHandlers = {};

const sendMessage = (action, ...data) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ action, data: data.map(String) }));
  } else {
    setTimeout(() => {
      sendMessage(action, ...data);
    }, 100);
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

const getCards = async (length: number) => {
  const res = await fetch(`${API_ENDPOINT}/card/${10 - length}`, {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
  return res.json();
};

export { sendMessage, onMessage, getCards };
