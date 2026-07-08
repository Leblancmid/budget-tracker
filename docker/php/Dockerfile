FROM php:8.2-fpm-alpine

RUN apk add --no-cache \
    git \
    curl \
    libzip-dev \
    zip \
    unzip \
    oniguruma-dev

RUN docker-php-ext-install pdo pdo_mysql mbstring bcmath zip

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

WORKDIR /var/www/html

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
