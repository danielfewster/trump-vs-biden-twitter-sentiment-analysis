FROM node:erbium as build
RUN mkdir -p /app/react-app
WORKDIR /app/react-app

COPY package.json /app/react-app/
ENV INLINE_RUNTIME_CHUNK=false

RUN npm install

COPY . /app/react-app/
RUN npm run build


FROM nginx:alpine
COPY --from=build /app/react-app/build /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]