.PHONY: install dev dev-api dev-web build kind-up kind-apply obs-up obs-down obs-logs data-up data-down sim sim-reset agent-dev

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

# Phase 4 — Prometheus + Loki + demo checkout-api telemetry
obs-up:
	docker compose -f infrastructure/observability/docker-compose.yml up -d --build

obs-down:
	docker compose -f infrastructure/observability/docker-compose.yml down

obs-logs:
	docker compose -f infrastructure/observability/docker-compose.yml logs -f --tail=100

# Phase 7 — optional Postgres + Redis (API still in-memory until persistence is wired)
data-up:
	docker compose -f infrastructure/data/docker-compose.yml up -d

data-down:
	docker compose -f infrastructure/data/docker-compose.yml down

# Recreate a demo incident (edit scripts/test_simulation/config.env first)
sim:
	chmod +x scripts/test_simulation/simulate.sh scripts/test_simulation/reset.sh
	./scripts/test_simulation/simulate.sh

sim-reset:
	chmod +x scripts/test_simulation/simulate.sh scripts/test_simulation/reset.sh
	./scripts/test_simulation/reset.sh

# Phase 5 investigation stub (API calls AGENT_URL, default :8090)
agent-dev:
	python3 agent/server.py
