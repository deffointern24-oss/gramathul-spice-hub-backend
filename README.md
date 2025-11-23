# Node.js E-Commerce Backend

A backend API built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)**.  
Features authentication, product, cart, order, and admin dashboard modules.

---

## Features

- **Authentication Module**
  - User/Admin signup & login (JWT-based)
  - Role-based access control

- **Product Management Module**
  - Admin can add, edit, delete products
  - **Image upload via mongo db **
  - Category sorting, product search
  - Product fields: name, description, price, category, stock, weight, images, isFeatured, createdBy, createdAt

- **Cart Module**
  - Users can add to cart, update quantity, remove items, and view cart

- **Order Module**
  - Users can place orders, view order history, get order details
  - Admin can view all orders and update their status
  - Fields: user, items, subtotal, tax, shipping, discount, paymentStatus, orderStatus, paymentMethod, deliveryAddress

- **Admin Dashboard APIs**
  - Total orders, total earnings, top selling products, total customers, recent orders

---

## Prerequisites

- Node.js (v14 or above)
- MongoDB database

---

## Environment Setup

Create a `.env` file at the root:

MONGO_URL=mongodb://localhost:27017/yourdbname
JWT_SECRET=your_secret_key
PORT=5000


---

## Installation

git clone <your-repo-url>
cd <project-folder>
npm install

---

## Run the Server (with hot reload)

npm run dev
Server runs on `http://localhost:5000`

---

## API Documentation & Testing

- Use [Postman](https://www.postman.com/) and import the provided Postman collection (`.json` file).
- All main APIs for Auth, Product, Cart, Order, and Admin Dashboard are included.

---

## Folder Structure Example

src/
config/
db.js
controllers/
authController.js
cartController.js
orderController.js
adminController.js
productController.js
models/
User.js
Product.js
Cart.js
Order.js
category.js
routes/
authRoutes.js
cartRoutes.js
orderRoutes.js
adminRoutes.js
productRoutes.js
middleware/
auth.js
upload.js
utils/
server.js


---

## Product API Testing (HTML Preview)

The Product Management API is fully functional.  
You can test product upload and listing—including image upload to MongoDB—using the provided `index.html` file.

**How to use:**
1. Make sure your backend API is running (with CORS enabled).
2. Open `index.html` in your browser.
3. Use the form to upload products with images.
4. Below the form, all products will be listed—including uploaded images and details.

> This demo HTML interface is for easy manual testing and preview of product features.  
> For actual project integration, use your frontend stack as needed.

**Note:**  
- Product images are served via:  
  `GET /api/products/:id/image/:imgIndex`
- All product upload endpoints require a valid JWT token (see the `TOKEN` variable in the HTML).

---

## License

This project is MIT licensed.
