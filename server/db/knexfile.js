const path = require('path');

module.exports = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: path.resolve(__dirname, 'fintrak.db'),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve(__dirname, 'migrations'),
    },
    seeds: {
      directory: path.resolve(__dirname, 'seeds'),
    },
  },

  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'fintrak',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'fintrak',
    },
    migrations: {
      directory: path.resolve(__dirname, 'migrations'),
    },
    seeds: {
      directory: path.resolve(__dirname, 'seeds'),
    },
  },
};
