# SN Clothing - E-Commerce Website

A modern, responsive e-commerce platform for clothing, shoes, and accessories built with React, Vite, and Bootstrap.

## 🚀 Features

- 📱 Fully responsive design
- 🛍️ Product catalog with categories (Men, Women, Kids, Shoes, Accessories)
- 🛒 Shopping cart functionality
- 🔍 Search as you type
- 💳 Secure checkout
- 👤 User authentication
- 📸 Dynamic image loading with SVG fallbacks
- 🎨 Custom design system with category theming

## 🛠️ Tech Stack

- **Frontend:** React 18, React Router DOM
- **Build Tool:** Vite
- **Styling:** Bootstrap 5, Custom CSS
- **State Management:** React Context API
- **Icons:** Bootstrap Icons
- **Images:** Dynamic imports with SVG fallbacks

## 📁 Project Structure
SN_Clothing_BrandNew/
├── public/ # Static assets
├── scripts/ # Build and utility scripts
├── src/
│ ├── assets/ # Images, logos, banners
│ │ ├── banners/ # Category banners
│ │ ├── blog/ # Blog images
│ │ ├── logos/ # Brand logos
│ │ └── team/ # Team photos
│ ├── components/ # Reusable components
│ ├── context/ # React Context providers
│ ├── data/ # Product catalog & media
│ ├── pages/ # Page components
│ └── utils/ # Utility functions
├── .gitignore
├── index.html
├── package.json
├── README.md
└── vite.config.js


## 🚦 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/sn-clothing.git

# Navigate to project directory
cd sn-clothing

# Install dependencies
npm install

# Start development server
npm run dev