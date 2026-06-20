# Lichte Node-image, voldoende voor een Express-app
FROM node:20-alpine

WORKDIR /app

# Eerst alleen package.json kopiëren en installeren — Docker cachet deze
# laag, zodat een latere wijziging in je broncode niet steeds opnieuw
# npm install hoeft te draaien (alleen als package.json zelf wijzigt).
# --omit=dev: testtools zoals vitest en nodemon horen niet in de
# productie-image, die maken hem alleen onnodig groter.
COPY package*.json ./
RUN npm install --omit=dev

# Daarna de rest van de broncode kopiëren
COPY . .

EXPOSE 3001

CMD ["node", "src/server.js"]
