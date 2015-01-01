FROM jlongster/archlinux
MAINTAINER James Long <longster@gmail.com>
RUN pacman --noconfirm -Sy nodejs redis nginx git
COPY ./sv/redis/ /service/redis
COPY dump.rdb /service/redis/dump.rdb
COPY ./sv/nginx/ /service/nginx
COPY ./.built/ /service/site/src-built/
COPY ./static/ /service/site/static/
COPY ./config/config-prod.json /service/site/config/config.json
COPY ./run /service/site/run
COPY ./package.json /service/site/package.json
COPY s.jlongster.com /sites/s.jlongster.com
WORKDIR /service/site/
RUN npm install

EXPOSE 80