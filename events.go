package main

import (
	"code.google.com/p/go.net/websocket"
	"encoding/json"
	"fmt"
	"github.com/samalba/dockerclient"
)

type FakeEvent dockerclient.Event

func eventCallback(event *dockerclient.Event, errors chan error, args ...interface{}) {
	fmt.Printf("Received event: %#v\n", *event)
	s := args[0].(server)
	msg, err := json.Marshal(struct {
		FakeEvent
		Server string
	}{
		FakeEvent: FakeEvent(*event),
		Server:    s.Id,
	})
	if err != nil {
		fmt.Printf("Couldn't Marshal: %#v, %s\n", event, err.Error())
	}
	group.Send(string(msg))
}

func watchEvents(ws *websocket.Conn) {

	member := group.Join()
	for {
		msg := member.Recv()
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
