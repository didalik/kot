# Variable references {{{1
AUTH ?= OWNER
# As of 9/13/25, the env.hx_ownerPK secret in dev is set to the creator's PK (see ./.dev.vars).
# It is set to the same value in qa. The corresponding hx_OWNER_PK value in the DO storage   
# is set to the owner's PK in both envs. This is done to test 'bin/setkeys $*' in both envs.
# When done testing, set the hx_ownerPK secret in prod to the owner's PK. For dev, bin/dev-conf
# takes care of that when you type 'npm run dev'. So update bin/dev-conf accordingly.
#
# TODO add bin/bit/hx/prod/* jobs and replace CREATOR.keys with OWNER.keys there.
# # # # #
BUILD_DIR := cloudflare-job-fair/module-topjob-hx-agent/lib/$\
						 module-topjob-hx-definition/reset_testnet/build
HX_QA_KIT ?= GD5J36GTTAOV3ZD3KLLEEY5WES5VHRWMUTHN3YYTOLA2YR3P3KPGXGAQ # FIXME
PHASE ?= dev
SHELL = bash
UNAME != uname

AUTH_KEYS := $$HOME/.cloudflare-job-fair/${AUTH}.keys
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
	@[ -e $@ ] && echo "$@ preserved" && exit 0 || bin/setkeys $* ${PHASE};\
		read JOB$*_SK JOB$*_PK < $$HOME/.cloudflare-job-fair/$*.keys;\
		read CREATOR_SK CREATOR_PK < $$HOME/.cloudflare-job-fair/CREATOR.keys;\
		export JOBUSER_SK=$$CREATOR_SK;\
		echo '{"key":"value"}' | bin/${PHASE}.mjs post_jcl $$CREATOR_PK hx ${HX_QA_KIT} dopad put hx_$*_PK $$JOB$*_PK

${TESTNET_DIR}: # reset_testnet {{{1
	@bin/bit/hx/${PHASE}/reset_testnet;\
		read CREATOR_SK CREATOR_PK < $$HOME/.cloudflare-job-fair/CREATOR.keys;\
		export JOBUSER_SK=$$CREATOR_SK;\
		bin/${PHASE}.mjs post_jcl $$CREATOR_PK hx ${HX_QA_KIT} dopad put hx_STELLAR_NETWORK testnet;\
		read SK PK < ${TESTNET_DIR}/HEX_Issuer.keys;\
		bin/${PHASE}.mjs post_jcl $$CREATOR_PK hx ${HX_QA_KIT} dopad put hx_testnet_IssuerPK $$PK

${TXIDS}: # setup_selftest {{{1
	@bin/bit/hx/${PHASE}/setup_selftest;\
		read CREATOR_SK CREATOR_PK < $$HOME/.cloudflare-job-fair/CREATOR.keys;\
		export JOBUSER_SK=$$CREATOR_SK;read < ${TXIDS};\
		bin/${PHASE}.mjs post_jcl $$CREATOR_PK hx ${HX_QA_KIT} dopad put hx_Agent_make2map_txids "$$REPLY"

.PHONY: clean # rm /home/alik/.cloudflare-job-fair/OWNER.keys to start from scratch {{{1
clean:
	@rm -f ${TESTNET_KEYS} ${TXIDS}
	@rm -rf ${TESTNET_DIR}

.PHONY: uname # {{{1
uname:; @echo ${UNAME} DONE


