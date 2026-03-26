# ITAM System

IT Asset Management System built with React, Vite, Material-UI, and Node.js backend.

## 🚀 Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Visit `http://localhost:5173`

### Backend
```bash
cd backend
npm install
npm run dev
```
API runs on `http://localhost:3001` or your configured PORT.

## 📱 Responsive & UI/UX Design System

The application is thoroughly optimized for all devices with modern UI paradigms:
- **Mobile (< 600px)**: Bottom navigation, full card layouts, touch-friendly 48px targets, iOS zoom-preventing 16px inputs.
- **Tablet (600-900px)**: Mini sidebar with icons, 2-column grid cards, responsive padding.
- **Desktop (> 900px)**: Full sidebar, complex data tables, hover effects, deep interactivity.

### Component Features
- **Glassmorphism**: Elegant translucent UI elements matching modern aesthetic standards.
- **Typography & Interaction**: Fluid typography using `clamp()`. High contrast ratios and smooth transitions. Safe area support for notched devices.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Material-UI v7, React Router v7, Axios.
- **Backend**: Node.js, Express, Supabase (PostgreSQL).

## 📦 Project Structure

```
itam/
├── frontend/           # React frontend application
│   ├── src/            # Source files (pages, components, layouts, contexts)
│   ├── public/         # Static assets
│   ├── index.css       # Global styles (including responsive utilities)
│   └── theme.js        # MUI Custom Theme Configuration
└── backend/            # Express JS backend application
    ├── src/            # Controllers, Routes, Services
    └── package.json    # Backend dependencies
```

## 🤝 Contributing

1. Run the servers locally.
2. Ensure you follow the responsive design system (test on mobile viewports!) before submitting code.
3. Keep code clean and well documented.

---
**Made with ❤️ for optimal user experience across all devices**
