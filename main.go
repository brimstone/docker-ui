package main

import (
	"encoding/json"
	"fmt"
	"github.com/brimstone/docker-ui/static"
	Proxy "github.com/brimstone/go-proxy"
	"github.com/elazarl/go-bindata-assetfs"
	"net/http"
)

var proxies []Proxy.Proxy

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

	http.HandleFunc("/servers/json", handlerServers)

	fmt.Println("Starting http server")
	go http.ListenAndServe(":8079", nil)

	//proxy, _ := Proxy.New("unix:///var/run/docker.sock")
	proxy, _ := Proxy.New()
	proxies = append(proxies, *proxy)

	// If it's / specifically, handle it with the asset server
	proxy.Handle("^/servers", "http://localhost:8079")

	// Handle requests directed at a particular server
	//proxy.Handle("server=liani$", "unix:///var/run/docker.sock")
	proxy.Handle("server=liani$", "unix:///tmp/proxysocket.sock")

	// Send docker looking like urls to our first socket
	proxy.Handle("/v", "unix:///tmp/proxysocket.sock")

	// everything else goes to the asset server
	proxy.Handle("/", "http://localhost:8079")

	proxy.ListenAndServe(":8080")

}
