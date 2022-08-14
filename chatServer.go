package main

import "log"

type WsServer struct {
	clients    map[*Client]bool
	register   chan *Client
	unregister chan *Client
	broadcast  chan []byte
	rooms      map[*Room]bool
}

func (server *WsServer) broadcastToClients(message []byte) {
	for client := range server.clients {
		client.send <- message
	}
}

// func (server *WsServer) notifyClientJoined(client *Client) {
// 	message := &Message{
// 		Action: UserJoinedAction,
// 		Sender: client,
// 	}

// 	server.broadcastToClients(message.encode())
// }

// func (server *WsServer) notifyClientLeft(client *Client) {
// 	message := &Message{
// 		Action: UserLeftAction,
// 		Sender: client,
// 	}

// 	server.broadcastToClients(message.encode())
// }

// func (server *WsServer) listOnlineClients(client *Client) {
// 	for existingClient := range server.clients {
// 		message := &Message{
// 			Action: UserJoinedAction,
// 			Sender: existingClient,
// 		}
// 		client.send <- message.encode()
// 	}
// }

// NewWebsocketServer creates a new WsServer type
func NewWebsocketServer() *WsServer {
	return &WsServer{
		clients:    make(map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan []byte),
		rooms:      make(map[*Room]bool),
	}
}

// Run our websocket server, accepting various requests
func (server *WsServer) Run() {
	for {
		select {

		case client := <-server.register:
			server.registerClient(client)

		case client := <-server.unregister:
			server.unregisterClient(client)
		case message := <-server.broadcast:
			server.broadcastToClients(message)

		}
	}
}

func (server *WsServer) registerClient(client *Client) {
	// server.notifyClientJoined(client)
	// server.listOnlineClients(client)
	server.clients[client] = true
}

func (server *WsServer) unregisterClient(client *Client) {
	log.Printf("se ha salido %s", client.GetName())
	delete(server.clients, client)
	// server.notifyClientLeft(client)
}

func (server *WsServer) findRoomByName(name string) *Room {
	var foundRoom *Room
	for room := range server.rooms {
		if room.GetName() == name {
			foundRoom = room
			break
		}
	}

	return foundRoom
}

func (server *WsServer) createRoom(name string) *Room {
	room := NewRoom(name)
	go room.RunRoom()
	server.rooms[room] = true

	return room
}
