package main

import (
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"os"
	"time"
)

type BlackCard struct {
	Text string `json:"text"`
	Pick int    `json:"pick"`
}

type Cards struct {
	BlackCards []BlackCard
	WhiteCards []string `json:"whiteCards"`
}

type Card struct {
	Text string `json:"text"`
	Id   string `json:"id"`
}

func getRandomBlackCard() string {
	// Open our jsonFile
	jsonFile, err := os.Open("data.json")
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println("Successfully Opened users.json")
	defer jsonFile.Close()

	byteValue, _ := io.ReadAll(jsonFile)

	var cards Cards

	json.Unmarshal(byteValue, &cards)

	rand.Seed(time.Now().Unix())

	return cards.BlackCards[rand.Intn(len(cards.BlackCards))].Text
}

func getWhiteCards(length int) []Card {
	// Open our jsonFile
	jsonFile, err := os.Open("data.json")
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println("Successfully Opened users.json")
	defer jsonFile.Close()

	byteValue, _ := io.ReadAll(jsonFile)

	var cards Cards

	json.Unmarshal(byteValue, &cards)

	var whiteCards = make([]Card, 0)
	for _, card := range cards.WhiteCards {
		whiteCards = append(whiteCards, Card{Text: card, Id: card})
	}

	var userCards = make([]Card, 0)
	for i := 0; i < length; i++ {
		userCards = append(userCards, whiteCards[rand.Intn(len(whiteCards))])
	}

	return userCards
}
