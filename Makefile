.PHONY: install dev dev-api dev-web build kind-up kind-apply

install:
	npm install

dev-api:
	npm run dev:api

dev-web:
	npm run dev:web

dev:
	npm run dev:api & npm run dev:web

build:
	npm run build

kind-up:
	kind create cluster --name opspilot || true
	kubectl config use-context kind-opspilot

kind-apply:
	kubectl apply -f infrastructure/kubernetes/base/namespace.yaml || kubectl create namespace opspilot
	kubectl apply -f infrastructure/kubernetes/base/test-app.yaml
