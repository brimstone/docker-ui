package main

import (
	"code.google.com/p/go.net/websocket"
	"encoding/json"
	"fmt"
	"github.com/samalba/dockerclient"
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
