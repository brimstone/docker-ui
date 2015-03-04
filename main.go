package main

import (
	"code.google.com/p/go.net/websocket"
	"encoding/json"
	"fmt"
	"github.com/brimstone/docker-ui/static"
	Proxy "github.com/brimstone/go-proxy"
	"github.com/elazarl/go-bindata-assetfs"
	"github.com/samalba/dockerclient"
	"net/http"
)

type envelope struct {
	channel chan string
}

func eventCallback(event *dockerclient.Event, errors chan error, args ...interface{}) {
	fmt.Printf("Received event: %#v\n", *event)
	context := args[0].(*envelope)
	msg, err := json.Marshal(event)
	if err != nil {
		fmt.Printf("Couldn't Marshal: %#v, %s\n", event, err.Error())
	}
	context.channel <- string(msg)
}

func watchEvents(ws *websocket.Conn) {

	context := &envelope{make(chan string)}
	docker, _ := dockerclient.NewDockerClient("unix:///var/run/docker.sock", nil)
	go docker.StartMonitorEvents(eventCallback, nil, context)

	for {
		msg := <-context.channel
		err := websocket.Message.Send(ws, msg)
		if err != nil {
			fmt.Println("Can't send")
			break
		}
	}

	/*
		var reply string
		err = websocket.Message.Receive(ws, &reply)
		if err != nil {
			fmt.Println("Can't receive")
			break
		}
		fmt.Println("Received back from client: " + reply)
	*/
}

func handlerServers(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-Type", "application/json")
	servers := make([]map[string]string, 0)
	//servers = append(servers, map[string]string{"Id": "noranti"})
	servers = append(servers, map[string]string{"Id": "liani"})
	out, _ := json.Marshal(servers)
	fmt.Fprint(w, string(out))
}

func main() {

	// setup asset handler
	http.Handle("/",
		http.FileServer(
			&assetfs.AssetFS{Asset: static.Asset, AssetDir: static.AssetDir, Prefix: "src"}))
	http.Handle("/proxyevents", websocket.Handler(watchEvents))

	http.HandleFunc("/servers/json", handlerServers)

	fmt.Println("Starting http server")
	go http.ListenAndServe(":8079", nil)

	proxy, _ := Proxy.New()

	// Don't jerk around websocket connections
	proxy.Handle("/proxyevents", "http://localhost:8079", false)

	// Handle requests directed at a particular server
	proxy.Handle("server=liani$", "unix:///var/run/docker.sock", true)
	//proxy.Handle("server=liani$", "unix:///tmp/proxysocket.sock")

	// Send docker looking like urls to our first socket
	proxy.Handle("^/v[0-9]", "unix:///var/run/docker.sock", true)

	// everything else goes to the asset server
	proxy.Handle("/", "http://localhost:8079", true)

	proxy.ListenAndServe(":8080")

}
