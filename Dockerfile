# Usando a imagem do Node.js
FROM node:16

# Diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copia o package.json e instala dependências
COPY package*.json ./
RUN npm install

# Copia o código do projeto
COPY . .

# Builda o projeto
RUN npm run build

# Expõe a porta que a aplicação vai rodar
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "run", "start:prod"]