FROM node:10 as socketio-tool-build

# docker trick for caching node_modules and bower_components
# node_modules
COPY ./package.json /temp/package.json
RUN cd /temp && npm install
COPY . /src/
RUN cp -Rf /temp/node_modules/. /src/node_modules/

FROM node:alpine
COPY --from=socketio-tool-build /src /root/src
WORKDIR /root/src
CMD ["npm", "run", "start", "--", "--cors", "-p", "8080"]

FROM node:10-alpine AS dev
WORKDIR /app

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint
RUN chmod +x /usr/local/bin/docker-entrypoint

ENTRYPOINT ["docker-entrypoint"]
EXPOSE 8080
