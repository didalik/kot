AUTH ?= OWNER
AUTH_KEYS := $$HOME/.cloudflare-job-fair/${AUTH}.keys
BUILD_DIR := cloudflare-job-fair/module-topjob-hx-agent/lib/$\
						 module-topjob-hx-definition/reset_testnet/build
PHASE ?= qa
TESTNET_DIR := ${BUILD_DIR}/testnet
TESTNET_KEYS := ${TESTNET_DIR}.keys
TXIDS := ${TESTNET_DIR}/HEX_Agent_make2map.txids

.PHONY: bit_hx_${PHASE}
bit_hx_${PHASE}: ${AUTH_KEYS} ${TESTNET_DIR} ${TXIDS}
	@bin/bit/hx/${PHASE}/selftest; echo $@ DONE

.PHONY: keys
keys: ${AUTH_KEYS}
	@echo $@ DONE

$$HOME/.cloudflare-job-fair/%.keys:
	@[ -e $@ ] && echo '$@ preserved' || bin/setkeys $*;\
		read JOB$*_SK JOB$*_PK < $$HOME/.cloudflare-job-fair/$*.keys;\
		read CREATOR_SK CREATOR_PK < $$HOME/.cloudflare-job-fair/CREATOR.keys;\
		bin/${PHASE}.mjs post_jcl $$CREATOR_PK hx/dopad put hx_$*_PK $$JOB$*_PK

${TESTNET_DIR}:
	@bin/bit/hx/${PHASE}/reset_testnet

${TXIDS}:
	@bin/bit/hx/${PHASE}/setup_selftest

.PHONY: clean
clean:
	@rm -f ${TESTNET_KEYS} ${TXIDS}
	@rm -rf ${TESTNET_DIR}
