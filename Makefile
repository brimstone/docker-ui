small: *.go static/build.go
	go fmt
	go build
	${GOPATH}/bin/goupx docker-ui

big: *.go static/build.go
	go fmt
	go build

static/build.go: static/src
	cd static; ${GOPATH}/bin/go-bindata -pkg=static -o=build.go -nomemcopy=true $(shell cd static; find . -type d)
