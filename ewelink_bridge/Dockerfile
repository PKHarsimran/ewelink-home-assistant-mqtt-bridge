ARG BUILD_FROM=ghcr.io/hassio-addons/base:15.0.7
FROM ${BUILD_FROM}

RUN apk add --no-cache nodejs npm

WORKDIR /app

COPY app/package.json /app/package.json
RUN npm install --omit=dev

COPY app/ /app/
COPY run.sh /run.sh
RUN chmod a+x /run.sh

EXPOSE 8099
CMD [ "/run.sh" ]
