# judelivery Backend API

Node.js server using Express and Sequelize for MySQL.

## Setup

```bash
cd backend
npm install
```

## Environment Variables

Copy `.env` and configure your MySQL connection:
- `PORT` - Server port (default: 5000)
- `DB_HOST` - MySQL host
- `DB_USER` - MySQL user
- `DB_PASSWORD` - MySQL password
- `DB_NAME` - Database name (default: judelivery)
- `FRONTEND_URL` - Frontend URL for CORS

## Run

```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

## Database

```bash
# Run migrations (creates tables)
npm run db:migrate

# Seed database with initial data
npm run db:seed
```

## API Endpoints

- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/google` - Google OAuth login
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `GET /api/companies` - Get all companies
- `GET /api/companies/:id` - Get company by ID
- `POST /api/companies` - Create company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order
- `GET /api/drivers` - Get all drivers
- `GET /api/drivers/:id` - Get driver by ID
- `GET /api/incidents` - Get all incidents
- `GET /api/notifications` - Get all notifications