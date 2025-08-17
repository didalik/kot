AUTH ?= owner
AUTH_KEYS := $$HOME/.cloudflare-job-fair/${AUTH}.keys
BUILD_DIR := cloudflare-job-fair/module-topjob-hx-agent/lib/$\
						 module-topjob-hx-definition/reset_testnet/build
PHASE ?= dev
TESTNET_DIR := ${BUILD_DIR}/testnet
TESTNET_KEYS := ${TESTNET_DIR}.keys
TXIDS := ${TESTNET_DIR}/HEX_Agent_make2map.txids

.PHONY: bit_hx_${PHASE}
bit_hx_${PHASE}: ${AUTH_KEYS} ${TESTNET_DIR} ${TXIDS}
	@bin/bit/hx/${PHASE}/selftest; echo $@ DONE

$$HOME/.cloudflare-job-fair/%.keys:
	@[ -e $@ ] && echo '$@ preserved' || bin/setkeys $*

${TESTNET_DIR}:
	@bin/bit/hx/${PHASE}/reset_testnet

${TXIDS}:
	@bin/bit/hx/${PHASE}/setup_selftest

.PHONY: clean
clean:
	@rm -f ${TESTNET_KEYS} ${TXIDS}
	@rm -rf ${TESTNET_DIR}
