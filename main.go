package main

import (
	"encoding/json"
	"flag"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/gorilla/mux"
)

var addr = flag.String("addr", ":3001", "http server address")

func middlewareCors(next http.Handler) http.Handler {
	return http.HandlerFunc(
		func(w http.ResponseWriter, req *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
			w.Header().Set("Access-Control-Allow-Headers", "*")

			next.ServeHTTP(w, req)
		})
}

// spaHandler implements the http.Handler interface, so we can use it
// to respond to HTTP requests. The path to the static directory and
// path to the index file within that static directory are used to
// serve the SPA in the given static directory.
type spaHandler struct {
	staticPath string
	indexPath  string
}

// ServeHTTP inspects the URL path to locate a file within the static dir
// on the SPA handler. If a file is found, it will be served. If not, the
// file located at the index path on the SPA handler will be served. This
// is suitable behavior for serving an SPA (single page application).
func (h spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// get the absolute path to prevent directory traversal
	path, err := filepath.Abs(r.URL.Path)
	if err != nil {
		// if we failed to get the absolute path respond with a 400 bad request
		// and stop
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// prepend the path with the path to the static directory
	path = filepath.Join(h.staticPath, path)

	// check whether a file exists at the given path
	_, err = os.Stat(path)
	if os.IsNotExist(err) {
		// file does not exist, serve index.html
		http.ServeFile(w, r, filepath.Join(h.staticPath, h.indexPath))
		return
	} else if err != nil {
		// if we got an error (that wasn't that the file doesn't exist) stating the
		// file, return a 500 internal server error and stop
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// otherwise, use http.FileServer to serve the static dir
	http.FileServer(http.Dir(h.staticPath)).ServeHTTP(w, r)
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

	spa := spaHandler{staticPath: "build", indexPath: "index.html"}
	myRouter.PathPrefix("/").Handler(spa)

	http.Handle("/", myRouter)

	log.Printf("Server started")
	log.Fatal(http.ListenAndServe(*addr, nil))
}
