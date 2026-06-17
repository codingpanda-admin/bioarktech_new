FROM node:20-alpine

WORKDIR /app

# Copiar configuración de dependencias
COPY package*.json /app/

# Instalar módulos de node
RUN npm install

# Copiar el código del frontend
COPY . /app/

EXPOSE 5173

# Ejecutar el servidor de desarrollo de Vite
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
