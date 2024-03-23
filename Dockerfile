FROM node:14
WORKDIR /app
COPY package*.json ./
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
EXPOSE 9229
CMD ["node", "--inspect=0.0.0.0:9229", "dist/src/main.js", "--server"]
