FROM jlongster/archlinux
MAINTAINER James Long <longster@gmail.com>

RUN pacman --noconfirm -Syu
RUN pacman --noconfirm -Sy nodejs npm nginx git
RUN mkdir -p /var/log/nginx
COPY ./sv/nginx/ /service/nginx
COPY ./server /service/site/server
COPY ./static/ /service/site/static/
COPY ./templates /service/site/templates
COPY ./config/config-prod.json /service/site/config/config.json
COPY ./run /service/site/run
COPY ./package.json /service/site/package.json
COPY ./.babelrc /service/site/.babelrc
WORKDIR /service/site/
RUN npm install
RUN mkdir log
RUN ln -s /usr/bin/rsvlog ./log/run

EXPOSE 8080
