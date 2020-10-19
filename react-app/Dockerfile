FROM node:erbium as build
RUN mkdir -p /app/client
WORKDIR /app/client

COPY package.json /app/client/
ENV INLINE_RUNTIME_CHUNK=false

RUN npm install

COPY . /app/client/
RUN npm run build


FROM nginx:alpine
COPY --from=build /app/client/build /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]