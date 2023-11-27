FROM node:lts as builder
USER root
WORKDIR /app
COPY src/package.json package.json
COPY src/package-lock.json package-lock.json
RUN npm ci  --debug 
COPY src/. .
RUN npm run build
RUN chown -R node:node /app
ENV PORT=3000
USER node
EXPOSE 3000
CMD [ "node", "index.js" ]