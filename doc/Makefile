# Encaminha alvos para a raiz do monorepo.
ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST)))/..)

%:
	@$(MAKE) -C $(ROOT) $*
