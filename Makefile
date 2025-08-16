AUTH ?= owner
AUTH_KEYS := $$HOME/.cloudflare-job-fair/${AUTH}.keys
TESTNET_DIR := ./cloudflare-job-fair/module-topjob-hx-agent/lib/$\
							 module-topjob-hx-definition/reset_testnet/$\
							 build/testnet
TESTNET_KEYS := ${TESTNET_DIR}.keys

.PHONY: bit_hx_dev
bit_hx_dev: ${AUTH_KEYS} ${TESTNET_DIR}
	@echo $@ DONE

$$HOME/.cloudflare-job-fair/%.keys:
	@[ -e $@ ] && echo '$@ preserved' || bin/setkeys $*

${TESTNET_DIR}:
	@bin/bit/hx/dev/reset_testnet

.PHONY: clean
clean:
	@rm -rf ${TESTNET_DIR}
