FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Use the correct command for Vite
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]