# Encaminha alvos para a raiz do monorepo (ex.: `make dev`, `make openapi-export`).
# Uso: pode correr `make` a partir de `doc/api/` sem `cd` para a raiz.
ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST)))/../..)

%:
	@$(MAKE) -C $(ROOT) $*
