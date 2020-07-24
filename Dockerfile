FROM zenika/alpine-chrome:with-puppeteer

WORKDIR /usr/src/app

COPY --chown=chrome package*.json ./

RUN npm install

COPY --chown=chrome . .

CMD [ "node","." ]

ENV TZ=Asia/Shanghai
