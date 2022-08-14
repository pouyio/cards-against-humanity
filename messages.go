package main

import (
	"encoding/json"
	"log"
)

const SendMessageAction = "send-message"
const JoinRoomAction = "enter-room"
const NewRoundAction = "new-round"
const JoinedRoomAction = "just-connected"
const LeaveRoomAction = "leave-room"
const CardSelectedAction = "card-selected"
const RoundWinAction = "round-win"
const YouWonAction = "you-won"

// const UserJoinedAction = "user-join"
// const UserLeftAction = "user-left"

type Message struct {
	Action  string        `json:"action"`
	Data    []interface{} `json:"data"`
	Sender  *Client       `json:"-"`
	Message string        `json:"-"`
	Target  string        `json:"-"`
}

func (message *Message) encode() []byte {
	json, err := json.Marshal(message)
	if err != nil {
		log.Println(err)
	}

	return json
}
