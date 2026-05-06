# ---------- Build Stage ----------
FROM node:20-alpine AS build

WORKDIR /app

COPY frontend/package*.json ./frontend/

WORKDIR /app/frontend

RUN npm install

COPY frontend/ ./

RUN npm run build


# ---------- Production Stage ----------
FROM nginx:alpine

COPY --from=build /app/frontend/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]