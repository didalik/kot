# Variable references {{{1
AUTH ?= OWNER
AUTH_KEYS := $$HOME/.cloudflare-job-fair/${AUTH}.keys
BUILD_DIR := cloudflare-job-fair/module-topjob-hx-agent/lib/$\
						 module-topjob-hx-definition/reset_testnet/build
PHASE ?= dev
SHELL = bash
TESTNET_DIR := ${BUILD_DIR}/testnet
TESTNET_KEYS := ${TESTNET_DIR}.keys
TXIDS := ${TESTNET_DIR}/HEX_Agent_make2map.txids

.PHONY: bit_hx_${PHASE} # {{{1
bit_hx_${PHASE}: ${AUTH_KEYS} ${TESTNET_DIR} ${TXIDS}
	@bin/bit/hx/${PHASE}/selftest; echo $@ DONE

## TODO remove these lines when done testing prerequisites {{{1
#
.PHONY: setup {{{2
setup: ${AUTH_KEYS} ${TESTNET_DIR} ${TXIDS}
	@echo $@ DONE

.PHONY: testnet {{{2
testnet: ${AUTH_KEYS} ${TESTNET_DIR}
	@echo $@ DONE

.PHONY: keys {{{2
keys: ${AUTH_KEYS}
	@echo $@ DONE
# }}}2
# 
##

$$HOME/.cloudflare-job-fair/%.keys: # {{{1
	@[ -e $@ ] && echo "$@ preserved" && exit 0 || bin/setkeys $*;\
		read JOB$*_SK JOB$*_PK < $$HOME/.cloudflare-job-fair/$*.keys;\
		read CREATOR_SK CREATOR_PK < $$HOME/.cloudflare-job-fair/CREATOR.keys;\
		bin/${PHASE}.mjs post_jcl $$CREATOR_PK hx/dopad put hx_$*_PK $$JOB$*_PK

${TESTNET_DIR}: # reset_testnet {{{1
	@bin/bit/hx/${PHASE}/reset_testnet;\
		read CREATOR_SK CREATOR_PK < $$HOME/.cloudflare-job-fair/CREATOR.keys;\
		bin/${PHASE}.mjs post_jcl $$CREATOR_PK hx/dopad put hx_STELLAR_NETWORK testnet;\
		read SK PK < ${TESTNET_DIR}/HEX_Issuer.keys;\
		bin/${PHASE}.mjs post_jcl $$CREATOR_PK hx/dopad put hx_testnet_IssuerPK $$PK

${TXIDS}: # setup_selftest {{{1
	@bin/bit/hx/${PHASE}/setup_selftest;\
		read CREATOR_SK CREATOR_PK < $$HOME/.cloudflare-job-fair/CREATOR.keys;\
		read < ${TXIDS}; bin/${PHASE}.mjs post_jcl $$CREATOR_PK hx/dopad put \
		hx_Agent_make2map_txids "$$REPLY"

.PHONY: clean # {{{1
clean:
	@rm -f ${TESTNET_KEYS} ${TXIDS}
	@rm -rf ${TESTNET_DIR}
