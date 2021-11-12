
SERVICE_TO_LINK=banking-service
link:
	cd ../allocations-services/packages/${SERVICE_TO_LINK} && yarn link
	yarn link ${SERVICE_TO_LINK}
unlink:
	yarn unlink ${SERVICE_TO_LINK}
	cd ../allocations-services/packages/${SERVICE_TO_LINK} && yarn unlink

dev:
	yarn start:watch

t:
	yarn test:watch