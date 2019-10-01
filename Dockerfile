FROM node:alpine AS build-env

COPY . /AngularApp

RUN cd AngularApp && \
    npm install && \
    npm audit fix && \
    npm run build-ci

FROM nginx:alpine

COPY --from=build-env /AngularApp/dist/* /usr/share/nginx/html/