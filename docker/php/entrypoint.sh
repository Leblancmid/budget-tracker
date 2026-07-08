#!/bin/sh
set -e

cd /var/www/html

# Install dependencies if vendor is missing
if [ ! -f vendor/autoload.php ]; then
    composer install --no-interaction --optimize-autoloader --no-dev
fi

# Fix storage permissions
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

php-fpm