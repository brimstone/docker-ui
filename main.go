package main

import (
	"code.google.com/p/go.net/websocket"
	"fmt"
	"github.com/brimstone/docker-ui/static"
	Proxy "github.com/brimstone/go-proxy"
	"github.com/elazarl/go-bindata-assetfs"
	"net/http"
)

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
