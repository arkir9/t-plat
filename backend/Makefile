# Forward make targets to project root Makefile. Run from repo root: make <target>
.PHONY: install-backend db-seed-events help

help:
	@echo "Run make from the project root (t-plat/), e.g.:"
	@echo "  cd .. && make install-backend"
	@echo "  cd .. && make db-seed-events"

install-backend:
	$(MAKE) -C .. install-backend

db-seed-events:
	$(MAKE) -C .. db-seed-events
