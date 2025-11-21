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
  - **Image upload via Cloudinary is currently not set up — product image upload features will not work**
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
- [Optional] Cloudinary account (required for product image upload)

---

## Environment Setup

Create a `.env` file at the root:

MONGO_URL=mongodb://localhost:27017/yourdbname
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5000


**Note:**  
If you do not set up Cloudinary, the image upload feature for products will not work, but all other API endpoints are functional.

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
models/
User.js
Product.js
Cart.js
Order.js
routes/
authRoutes.js
cartRoutes.js
orderRoutes.js
adminRoutes.js
middleware/
auth.js
utils/
server.js


---

## ⚠️ Limitations

> **Product image upload is non-functional until Cloudinary is set up.  
> You may comment out image upload logic to use the rest of the API.  
> All other modules and endpoints are working.**

---

## License

This project is MIT licensed.
