FROM node:v18.19.1 AS build

WORKDIR /app

COPY package-lock.json ./
COPY package.json ./

RUN npm install 
COPY . . 

# build
RUN npm run build 

# run

FROM nginx:alpine
# install envsubst
RUN apk add --no-cache gettext
# set up nginx

COPY --from=build /app/build /usr/share/nginx/html/config.js
COPY /public/config.js /usr/share/nginx/html/config.js
COPY env.sh  /env.sh

RUN chmod +x /env.sh
EXPOSE 80
CMD [ "/env.sh" ]







