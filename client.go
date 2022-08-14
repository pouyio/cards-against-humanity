package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

const (
	// Max wait time when writing message to peer
	writeWait = 10 * time.Second

	// Max time till next pong from peer
	pongWait = 60 * time.Second

	// Send ping interval, must be less then pong wait time
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 10000
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  4096,
	WriteBufferSize: 4096,
	// We'll need to check the origin of our connection
	// this will allow us to make requests from our React
	// development server to here.
	// For now, we'll do no checking and just allow any connection
	CheckOrigin: func(r *http.Request) bool { return true },
}

// Client represents the websocket client at the server
type Client struct {
	// The actual websocket connection.
	conn     *websocket.Conn
	wsServer *WsServer
	send     chan []byte
	room     *Room
	Name     string    `json:"nick"`
	ID       uuid.UUID `json:"id"`
	Counter  int       `json:"counter"`
	IsLeader bool      `json:"isLeader"`
}

func newClient(conn *websocket.Conn, wsServer *WsServer) *Client {
	return &Client{
		conn:     conn,
		wsServer: wsServer,
		send:     make(chan []byte, 256),
		ID:       uuid.New(),
		Counter:  0,
		IsLeader: false,
	}
}

func (client *Client) readPump() {
	defer func() {
		client.disconnect()
	}()

	client.conn.SetReadLimit(maxMessageSize)
	client.conn.SetReadDeadline(time.Now().Add(pongWait))
	client.conn.SetPongHandler(func(string) error { client.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })

	// Start endless read loop, waiting for messages from client
	for {
		_, jsonMessage, err := client.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("unexpected close error: %v", err)
			}
			break
		}

		client.handleNewMessage(jsonMessage)

	}
}

var (
	newline = []byte{'\n'}
	space   = []byte{' '}
)

func (client *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		client.conn.Close()
	}()
	for {
		select {
		case message, ok := <-client.send:
			client.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The WsServer closed the channel.
				client.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := client.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Attach queued chat messages to the current websocket message.
			// n := len(client.send)
			// for i := 0; i < n; i++ {
			// 	w.Write(newline)
			// 	w.Write(<-client.send)
			// }

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			client.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := client.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (client *Client) GetName() string {
	return client.Name
}

func (client *Client) disconnect() {
	if client.room != nil {
		client.room.unregister <- client
	}
	client.wsServer.unregister <- client
}

func (client *Client) handleNewMessage(jsonMessage []byte) {

	var messageInput Message
	if err := json.Unmarshal(jsonMessage, &messageInput); err != nil {
		log.Printf("Error on unmarshal JSON message %s", err)
	}

	switch messageInput.Action {
	case SendMessageAction:
		// The send-message action, this will send messages to a specific room now.
		// Which room wil depend on the message Target
		// roomName := message.Target
		// Use the ChatServer method to find the room, and if found, broadcast!
		// if room := client.wsServer.findRoomByName(roomName); room != nil {
		// 	room.broadcast <- &message
		// }
	case JoinRoomAction:
		client.handleJoinRoomMessage(messageInput)
	case LeaveRoomAction:
		client.handleLeaveRoomMessage(messageInput)
	case CardSelectedAction:
		client.handleCardSelected(messageInput)
	case RoundWinAction:
		client.handleRoundWin(messageInput)
	}
}

func (client *Client) handleJoinRoomMessage(messageInput Message) {
	clientName := messageInput.Data[0].(string)
	roomName := messageInput.Data[1].(string)
	counterStr := messageInput.Data[2].(string)
	counter, _ := strconv.Atoi(counterStr)

	room := client.wsServer.findRoomByName(roomName)
	if room == nil {
		room = client.wsServer.createRoom(roomName)
	}

	client.Name = clientName
	client.room = room
	client.Counter = counter

	room.register <- client
}

func (client *Client) handleLeaveRoomMessage(messageInput Message) {
	if client.room == nil {
		return
	}

	room := client.wsServer.findRoomByName(client.room.Name)
	if room == nil {
		return
	}

	room.unregister <- client

}

func (client *Client) handleCardSelected(messageInput Message) {
	if client.room == nil {
		return
	}

	room := client.wsServer.findRoomByName(client.room.Name)
	if room == nil {
		return
	}

	var leaderClient *Client
	for client := range room.clients {
		if client.IsLeader {
			leaderClient = client
		}
	}

	cardSelectedData := make([]interface{}, 4)
	cardSelectedData[0] = messageInput.Data[0]
	cardSelectedData[1] = messageInput.Data[1]
	cardSelectedData[2] = client.Name
	cardSelectedData[3] = client.ID
	cardSelectedMessage := &Message{Action: CardSelectedAction, Data: cardSelectedData}
	leaderClient.send <- cardSelectedMessage.encode()

}

func (client *Client) handleRoundWin(messageInput Message) {
	if client.room == nil {
		return
	}

	room := client.wsServer.findRoomByName(client.room.Name)
	if room == nil {
		return
	}

	var winnerClient *Client
	for client := range room.clients {
		if client.ID.String() == messageInput.Data[0] {
			winnerClient = client
		}
	}

	winnerClient.Counter++

	roundWonData := make([]interface{}, 1)
	roundWonData[0] = winnerClient
	var roundWonMessage = &Message{Action: YouWonAction, Data: roundWonData}
	for client := range room.clients {
		client.send <- roundWonMessage.encode()
	}

	room.blackCard = getRandomBlackCard()
	room.newRound()

}

// ServeWs handles websocket requests from clients requests.
func ServeWs(wsServer *WsServer, w http.ResponseWriter, r *http.Request) {

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	client := newClient(conn, wsServer)

	go client.writePump()
	go client.readPump()

	wsServer.register <- client

	log.Println("New Client joined")
	log.Println(client)
}
