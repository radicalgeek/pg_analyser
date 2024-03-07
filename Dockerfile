FROM node:14
WORKDIR /app
COPY package*.json ./
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["node", "--inspect=0.0.0.0:9229", "src/main.js"]
