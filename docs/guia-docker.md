# Guia básico para Docke no projeto Nimbus

## Docker 
### O que é o docker ?

O **Docker** conteineriza o projeto, sendo basicamente uma caixa com tudo o que seu projeto precisa para rodar, como bibliotecas, frameworks, dependências e etc. Então você deixa tudo isso nesse container e, quando ele vai para a nuvem ou para qualquer outro lugar, tudo continua funcionando perfeitamente, pois tudo o que é necessário para aquele projeto funcionar está guardado no container. O que acaba evitando o 'na minha maquina funciona'. Tendo em vista que estamos em um projeto onde temos mais de uma pessoa trabalhando e também VMs e afins, é fundamental que usemos o Docker dentro deste projeto. 

>⚠️ **Atenção:** o Docker não funciona no Windows nativamente. Para fazê-lo funcionar é necessário usar o **WSL**, que funciona como uma máquina virtual Linux no Windows, porém isso consome uma quantidade valiosa de memória RAM. Então, se você pensa em desenvolver localmente alguns pipelines um pouco mais exigentes, recomendo utilizar uma distro Linux.

com um comando 'Docker --version' você pode verificar a versão do Docker instalado na sua maquina, caso não tenho Docker instalado siga os passos:

> **Observação:** É fundamental a compreensão de algumas termos como portas, iso e afins.
### Imagens

Uma imagem Docker da mais é do que um modelo, e é esse modelo (imagem) que o Docker usa para construir um container.

Você pode ver as imagens deste projeto usando o comando 'docker imagens' no terminal.

Já existem imagens prontas para diversas aplicações, você pode encontrar imagens no site do docker hub https://hub.docker.com/hardened-images/catalog.

Uma imagem é criada em um arquivo **Dockerfile**

### Dockerfile

O Dockerfile é um arquivo que contém as informações e comandos para a criação de uma imagem, nele está todo o passo a passo do ambiente que será construído, no caso tudo que vai existir dentro do contêiner.

Um Dockerfile é escrito da seguinte forma: 

```
# 1. Imagem base oficial
FROM node:20-alpine

# 2. Diretório dentro do container
WORKDIR /usr/src/app

# 3. Copia dependências e instala
COPY package*.json ./
RUN npm install --only=production

# 4. Copia o restante do código-fonte
COPY . .

# 5. Expõe a porta e define o comando de inicialização
EXPOSE 3000
CMD ["node", "server.js"]
```
### Containers

A partir da imagem temos finalmente o contêiner, uma caixa isolado com todas dependências que nossa aplicação precisa para rodar em qualquer ambiente, ou seja, isso funciona na minha maquina, na sua ou em uma VM em uma cloud. Dentro de um projeto como esse é fundamental e padrão para o desenvolvimento.
### Docker Compose

Docker compose é um arquivo escrito na linguagem YAML, ele serve para subir uma aplicação com múltiplos contêineres, exemplo, você usará Redis,PostgreSQL e Airflow, logo precisara de vários contêineres, e é justamente o composer que contém tudo isso.

O composer aparece da seguinte forma 

```
services:
  # 1. FRONTEND (Sua aplicação Web - Precisa de Dockerfile próprio)
  frontend:
    build: ./frontend
    ports:
      - "8080:80"
    depends_on:
      - api

  # 2. BACKEND / API (Sua aplicação - Precisa de Dockerfile)
  api:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=banco
      - DB_PASSWORD=secret
      - REDIS_HOST=cache
    depends_on:
      - banco
      - cache

  # 3. BANCO DE DADOS (Serviço pronto do Docker Hub)
  banco:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: app_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data

  # 4. CACHE / FILA (Serviço pronto do Docker Hub)
  cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  # 5. INTERFACE DO BANCO DE DADOS (Ferramenta pronta do Docker Hub)
  admin-db:
    image: adminer:latest
    ports:
      - "8081:8080"
    depends_on:
      - banco

# Volumes para não perder os dados quando o container parar
volumes:
  pgdata:

```  

### Volumes e persistência

Por padrão, os contêineres são **efêmeros** (descartáveis): qualquer arquivo criado ou alterado dentro dele é permanentemente perdido quando o container é destruído. Os **Volumes** são o mecanismo do Docker para persistir dados fora do ciclo de vida do contêiner e permitir o compartilhamento de arquivos entre a máquina física (host) e os contêineres.

### Limites de recursos

Também é possível definirmos os recurso computacionais para cada contêiner, limitando uso de processador e memória ram. Assim podemos distribuir recursos para diversos contêineres  e mantes uma aplicação funcionando de maneira otimizada.

```
services:
  api:
    image: minha-api:latest
    ports:
      - "3000:3000"
    deploy:
      resources:
        # Limite Máximo (Hard Limit): teto que o container não pode ultrapassar
        limits:
          cpus: '1.5'      # Máximo de 1 núcleos de CPU
          memory: 512M     # Máximo de 512 MB de memória RAM
        
        # Reserva Mínima (Soft Limit): recurso garantido para o container rodar
        reservations:
          cpus: '0.5'      # Garante pelo menos 0.5 núcleo de CPU
          memory: 256M     # Garante pelo menos 256 MB de RAM
```

### Comandos básicos 

**Gerenciamento de Containers**

| Comando | Descrição |
| --- | --- |
| `docker run -d --name <nome> -p 80:80 <imagem>` | Cria e inicia um container em segundo plano mapeando portas |
| `docker ps` | Lista os containers em execução |
| `docker ps -a` | Lista todos os containers (ativos e parados) |
| `docker start <id_ou_nome>` | Inicia um container que estava parado |
| `docker stop <id_ou_nome>` | Para a execução de um container de forma graciosa |
| `docker restart <id_ou_nome>` | Reinicia um container |
| `docker rm <id_ou_nome>` | Remove um container parado |
| `docker rm -f <id_ou_nome>` | Força a parada e remoção imediata de um container |
| `docker exec -it <id_ou_nome> sh` | Abre um terminal interativo dentro do container (`sh` ou `bash`) |
| `docker logs -f <id_ou_nome>` | Acompanha os logs de saída do container em tempo real |
| `docker stats` | Exibe o consumo de CPU, memória e rede dos containers em tempo real |
| `docker inspect <id_ou_nome>` | Exibe todas as informações técnicas e configurações em JSON |

---

**Gerenciamento de Imagens**

| Comando | Descrição |
| --- | --- |
| `docker build -t <nome:tag> .` | Constrói uma imagem a partir do Dockerfile no diretório atual |
| `docker images` | Lista todas as imagens salvas localmente |
| `docker pull <imagem:tag>` | Baixa uma imagem do Docker Hub |
| `docker push <usuario/imagem:tag>` | Envia uma imagem local para um repositório remoto |
| `docker rmi <id_ou_nome>` | Remove uma imagem local |
| `docker history <imagem>` | Mostra as camadas (*layers*) e comandos usados para criar a imagem |

---

**Docker Compose**

| Comando | Descrição |
| --- | --- |
| `docker compose up -d` | Constrói e inicializa todos os serviços definidos no YAML em segundo plano |
| `docker compose down` | Para e remove containers e redes criados pela stack |
| `docker compose down -v` | Para a stack e remove também os volumes persistentes criados |
| `docker compose ps` | Lista o status dos serviços do Compose |
| `docker compose logs -f [serviço]` | Exibe o fluxo unificado de logs (ou de um serviço específico) |
| `docker compose build` | Força a reconstrução das imagens dos serviços |
| `docker compose restart [serviço]` | Reinicia os serviços da aplicação |

---

**Volumes e Redes**

| Comando | Descrição |
| --- | --- |
| `docker volume ls` | Lista todos os volumes existentes no host |
| `docker volume create <nome>` | Cria um novo volume nomeado |
| `docker volume inspect <nome>` | Mostra o caminho físico dos dados no disco |
| `docker volume rm <nome>` | Remove um volume específico (se não estiver em uso) |
| `docker network ls` | Lista todas as redes criadas |
| `docker network create <nome>` | Cria uma nova rede de containers |
| `docker network connect <rede> <container>` | Conecta um container em execução a uma rede existente |

---

**Limpeza e Manutenção**

| Comando | Descrição |
| --- | --- |
| `docker system df` | Exibe o espaço em disco ocupado por containers, imagens e volumes |
| `docker system prune` | Remove containers parados, redes não utilizadas e imagens sem tag |
| `docker system prune -a --volumes` | Remove **todos** os recursos não utilizados (imagens, containers e volumes) |
| `docker volume prune` | Remove todos os volumes órfãos que não estão atrelados a nenhum container |