package main

import (
	"encoding/json"
	"fmt"
	"github.com/brimstone/docker-ui/static"
	Proxy "github.com/brimstone/go-proxy"
	"github.com/elazarl/go-bindata-assetfs"
	"net/http"
	"net/url"
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

func handlerProxy(w http.ResponseWriter, r *http.Request) {
	proxy := proxies[0]
	o, _ := url.ParseRequestURI(r.RequestURI)
	values := o.Query()
	if values["server"] != nil {
		// [todo] - Find proxy by name
		fmt.Println("TODO Find proxy by name")
	}
	proxy.Handle(w, r)
}

func main() {

	proxy, _ := Proxy.New("unix:///var/run/docker.sock")
	proxies = append(proxies, *proxy)

	http.Handle("/",
		http.FileServer(
			&assetfs.AssetFS{Asset: static.Asset, AssetDir: static.AssetDir, Prefix: "src"}))
	http.HandleFunc("/servers/json", handlerServers)
	http.HandleFunc("/containers/", handlerProxy)
	http.HandleFunc("/images/", handlerProxy)

	fmt.Println("Starting server")
	http.ListenAndServe(":8080", nil)
}
