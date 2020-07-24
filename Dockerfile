FROM buildkite/puppeteer

WORKDIR /usr/src/app

# USER root
# RUN apk update -U && \
#     apk add --no-cache \
#     chromium-chromedriver \
#     && rm -rf /var/cache/* \
#     && mkdir /var/cache/apk \
#     .
# USER chrome

COPY package*.json ./

RUN npm install

COPY . .

CMD [ "node","." ]

ENV TZ=Asia/Shanghai
