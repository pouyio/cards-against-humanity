package main

type Room struct {
	Name       string
	clients    map[*Client]bool
	register   chan *Client
	unregister chan *Client
	broadcast  chan *Message
	hasStarted bool
	blackCard  string
}

// NewRoom creates a new Room
func NewRoom(name string) *Room {
	return &Room{
		Name:       name,
		clients:    make(map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *Message),
		hasStarted: false,
		blackCard:  "",
	}
}

// RunRoom runs our room, accepting various requests
func (room *Room) RunRoom() {
	for {
		select {

		case client := <-room.register:
			room.registerClientInRoom(client)

		case client := <-room.unregister:
			room.unregisterClientInRoom(client)

		case message := <-room.broadcast:
			room.broadcastToClientsInRoom(message.encode())

		}
	}
}

func (room *Room) registerClientInRoom(client *Client) {
	room.clients[client] = true
	var data = make([]interface{}, 3)
	data[0] = client.GetName()
	data[1] = room.Name
	data[2] = client.ID.String()
	var message = &Message{Action: JoinedRoomAction, Data: data}
	client.send <- message.encode()

	var clientsConnected = make([]interface{}, 0)
	for client := range room.clients {
		clientsConnected = append(clientsConnected, client)
	}

	var messageToAll = &Message{Action: JoinRoomAction, Data: clientsConnected}
	room.broadcastToOtherClientsInRoom(client, messageToAll.encode())

	if !room.hasStarted {
		room.hasStarted = true
		room.newRound()
	} else {
		var newRoundData = make([]interface{}, 2)
		newRoundData[0] = room.blackCard
		newRoundData[1] = clientsConnected
		var newRoundMessage = &Message{Action: NewRoundAction, Data: newRoundData}
		client.send <- newRoundMessage.encode()
	}
}

func (room *Room) unregisterClientInRoom(client *Client) {
	delete(room.clients, client)
	var restClientsConneted = make([]interface{}, 0)
	for client := range room.clients {
		restClientsConneted = append(restClientsConneted, client)
	}

	if len(restClientsConneted) == 0 {
		room.hasStarted = false
	}

	var leaveMessage = &Message{Action: LeaveRoomAction, Data: restClientsConneted}
	room.broadcastToOtherClientsInRoom(client, leaveMessage.encode())

	if client.IsLeader {
		room.newRound()
	}

	room = nil
}

func (room *Room) broadcastToClientsInRoom(message []byte) {
	for client := range room.clients {
		client.send <- message
	}
}

func (room *Room) broadcastToOtherClientsInRoom(sender *Client, message []byte) {
	senderName := sender.GetName()
	for client := range room.clients {
		name := client.GetName()
		if senderName != name {
			client.send <- message
		}
	}
}

func (room *Room) GetName() string {
	return room.Name
}

func recalculateLeader(room *Room) {
	var clientsArr = make([]*Client, 0)
	counter, leaderIndex, newLeaderIndex := 0, -1, 0
	for client := range room.clients {
		clientsArr = append(clientsArr, client)
		if client.IsLeader {
			leaderIndex = counter
		}
		counter++
	}

	if !(leaderIndex == -1) && !((leaderIndex + 1) == len(clientsArr)) {
		newLeaderIndex = leaderIndex + 1
	}

	if leaderIndex != -1 {
		clientsArr[leaderIndex].IsLeader = false
	}

	if newLeaderIndex >= 0 && len(clientsArr) > 0 {
		clientsArr[newLeaderIndex].IsLeader = true
	}

}

func (room *Room) newRound() {
	recalculateLeader(room)

	var clientsConnected = make([]interface{}, 0)
	for client := range room.clients {
		clientsConnected = append(clientsConnected, client)
	}

	room.blackCard = getRandomBlackCard()
	var newRoundData = make([]interface{}, 2)
	newRoundData[0] = room.blackCard
	newRoundData[1] = clientsConnected
	var newRoundMessage = &Message{Action: NewRoundAction, Data: newRoundData}
	room.broadcastToClientsInRoom(newRoundMessage.encode())
}
