.PHONY: build

all: dev

dev:
	npm run dev

start: build
	docker-compose up --build

build:
	docker build . -t endaaman/endaaman.me

push: build
	docker push endaaman/endaaman.me

pull:
	docker pull endaaman/endaaman.me
