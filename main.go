package main

import (
	"encoding/json"
	"flag"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

var addr = flag.String("addr", ":3001", "http server address")

func middlewareCors(next http.Handler) http.Handler {
	return http.HandlerFunc(
		func(w http.ResponseWriter, req *http.Request) {
			// Just put some headers to allow CORS...
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
			w.Header().Set("Access-Control-Allow-Headers", "*")
			// and call next handler!
			next.ServeHTTP(w, req)
		})
}

func main() {
	flag.Parse()

	wsServer := NewWebsocketServer()
	go wsServer.Run()

	myRouter := mux.NewRouter()

	// CORS
	myRouter.PathPrefix("/").HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
	}).Methods(http.MethodOptions)
	myRouter.Use(middlewareCors)

	myRouter.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		ServeWs(wsServer, w, r)
	})

	myRouter.HandleFunc("/card/{number}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		number := vars["number"]
		length, _ := strconv.Atoi(number)
		cards := getWhiteCards(length)
		json.NewEncoder(w).Encode(cards)

	})

	// fs := http.FileServer(http.Dir("./build"))
	// http.Handle("/", fs)

	http.Handle("/", myRouter)

	log.Printf("Server started")
	log.Fatal(http.ListenAndServe(*addr, nil))
}
