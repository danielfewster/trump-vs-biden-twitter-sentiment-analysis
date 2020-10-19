FROM node:erbium
RUN mkdir -p /app/express-app
WORKDIR /app/express-app

COPY package*.json /app/express-app/

RUN npm install

COPY . /app/express-app/

CMD ["npm", "start"]