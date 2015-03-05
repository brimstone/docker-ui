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

type server struct {
	Id     string
	Url    string
	Info   *dockerclient.Info
	Client *dockerclient.DockerClient
}

var servers []server

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
	// [todo] This needs to use the right client
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
	s := make([]map[string]string, 0)
	for i := 0; i < len(servers); i++ {
		s = append(s, map[string]string{"Id": servers[i].Id})
	}
	out, _ := json.Marshal(s)
	fmt.Fprint(w, string(out))
}

func addServer(u string) error {
	s := server{Url: u}
	var err error

	s.Client, err = dockerclient.NewDockerClient(u, nil)
	if err != nil {
		return err
	}

	s.Info, err = s.Client.Info()
	if err != nil {
		return err
	}

	s.Id = s.Info.Name

	servers = append(servers, s)

	return nil
}

func main() {
	servers = make([]server, 0)

	// [todo] figure out cmd line params
	addServer("unix:///var/run/docker.sock")

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
	for i := 0; i < len(servers); i++ {
		proxy.Handle("server="+servers[i].Id+"$", servers[i].Url, true)
	}
	//proxy.Handle("server=liani$", "unix:///tmp/proxysocket.sock")

	// Send docker looking like urls to our first socket
	proxy.Handle("^/v[0-9]", "unix:///var/run/docker.sock", true)

	// everything else goes to the asset server
	proxy.Handle("/", "http://localhost:8079", true)

	proxy.ListenAndServe(":8080")

}
