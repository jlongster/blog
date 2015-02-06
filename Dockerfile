FROM jlongster/archlinux
MAINTAINER James Long <longster@gmail.com>
RUN pacman --noconfirm -Sy nodejs redis nginx git
COPY ./sv/redis/ /service/redis
RUN mkdir -p /var/log/nginx
COPY ./sv/nginx/ /service/nginx
COPY ./.built/ /service/site/src-built/
COPY ./static/ /service/site/static/
COPY ./config/config-prod.json /service/site/config/config.json
COPY ./run /service/site/run
COPY ./package.json /service/site/package.json
WORKDIR /service/site/
RUN npm install
RUN ln -s /service/site/src-built/server/impl node_modules/impl
RUN mkdir log
RUN ln -s /usr/bin/rsvlog ./log/run

EXPOSE 8080
