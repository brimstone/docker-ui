package main

import (
	"encoding/json"
	"fmt"
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
