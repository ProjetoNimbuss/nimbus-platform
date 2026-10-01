# Stage 1: Build dependências usando Composer
FROM composer:2.7 AS builder

WORKDIR /app

# Copiar os arquivos do projeto para o builder
COPY . .

# Instalar as dependências de produção do Laravel
# O "if" garante que não vai quebrar caso o composer.json ainda esteja vazio (projeto em setup inicial)
RUN if [ -f composer.json ]; then \
        composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --ignore-platform-reqs; \
    fi

# Stage 2: Imagem final de Produção
FROM php:8.3-fpm-alpine

# Definir o diretório de trabalho
WORKDIR /var/www/html

# Instalar pacotes de sistema necessários e as extensões PHP (PostgreSQL + Opcache)
RUN apk add --no-cache \
    postgresql-libs \
    postgresql-dev \
    && docker-php-ext-install pdo_pgsql opcache \
    && apk del postgresql-dev

# Instalar o Composer no estágio final conforme solicitado
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

# Usar a configuração padrão de produção do PHP
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# Configurar OPcache para máxima performance em produção
RUN { \
    echo 'opcache.memory_consumption=256'; \
    echo 'opcache.interned_strings_buffer=16'; \
    echo 'opcache.max_accelerated_files=10000'; \
    echo 'opcache.revalidate_freq=0'; \
    echo 'opcache.validate_timestamps=0'; \
    echo 'opcache.fast_shutdown=1'; \
    echo 'opcache.enable_cli=1'; \
    } > /usr/local/etc/php/conf.d/opcache-recommended.ini

# Copiar o código da aplicação do builder stage
COPY --from=builder /app /var/www/html

# Criar os diretórios base do Laravel caso não existam e ajustar permissões otimizadas
RUN mkdir -p /var/www/html/storage/framework/sessions \
    /var/www/html/storage/framework/views \
    /var/www/html/storage/framework/cache \
    /var/www/html/storage/logs \
    /var/www/html/bootstrap/cache \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache

# Alternar para o usuário não-root do servidor web (www-data)
USER www-data

# Expor a porta 9000 para comunicação com o Nginx/Webserver
EXPOSE 9000

# Comando padrão para iniciar o PHP-FPM
CMD ["php-fpm"]
