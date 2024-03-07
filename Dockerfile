FROM node:14
WORKDIR /app
COPY package*.json ./
RUN npm run build
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "src/main.js"]
