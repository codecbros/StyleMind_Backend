# Primera etapa: instalar las dependencias de desarrollo y construir la aplicación
FROM node:22-bookworm-slim AS builder
WORKDIR /usr/src/app
RUN apt update && apt upgrade -y
# RUN apt install -y openssl
COPY ./package.json ./yarn.lock ./
COPY . .
RUN yarn install --frozen-lockfile
# RUN npx prisma generate
RUN yarn build:swc

# Segunda etapa: imagen final
FROM node:22-bookworm-slim
WORKDIR /usr/src/app

RUN apt update && apt upgrade -y
# RUN apt update && apt install -y chromium

# RUN apt install -y openssl
# ENV PUPPETEER_EXECUTABLE_PATH='/usr/bin/chromium'
# COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/yarn.lock ./yarn.lock
COPY --from=builder /usr/src/app/dist ./dist
# COPY --from=builder /usr/src/app/views ./views

RUN yarn install --production --frozen-lockfile
EXPOSE 3000
CMD ["node", "dist/main"]