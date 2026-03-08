# ITAM System - Frontend

IT Asset Management System built with React, Vite, and Material-UI.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`

## 📱 Responsive & UI/UX

Aplikasi ini telah dioptimalkan untuk semua device (mobile, tablet, desktop) dengan UI/UX yang modern dan nyaman.

### 📚 Dokumentasi Lengkap

1. **[RESPONSIVE_SUMMARY_ID.md](./RESPONSIVE_SUMMARY_ID.md)** ⭐ **MULAI DI SINI**
   - Ringkasan lengkap dalam Bahasa Indonesia
   - Overview semua fitur responsif
   - Perbandingan sebelum & sesudah
   - Testing checklist

2. **[QUICK_START_RESPONSIVE.md](./QUICK_START_RESPONSIVE.md)** 🚀 **UNTUK DEVELOPER**
   - Setup & testing guide
   - Common patterns & examples
   - Debugging tips
   - Best practices

3. **[BREAKPOINTS_GUIDE.md](./BREAKPOINTS_GUIDE.md)** 📐 **REFERENCE**
   - Breakpoints detail (xs, sm, md, lg, xl)
   - Penggunaan di komponen
   - Layout patterns
   - Quick reference table

4. **[UI_UX_IMPROVEMENTS.md](./UI_UX_IMPROVEMENTS.md)** 🎨 **DESIGN SYSTEM**
   - Color system & typography
   - Component improvements
   - Animations & transitions
   - Accessibility features

5. **[RESPONSIVE_FEATURES.md](./RESPONSIVE_FEATURES.md)** 📋 **TECHNICAL DETAILS**
   - Fitur responsif lengkap
   - Performance optimizations
   - Browser compatibility
   - Testing checklist

## 🎯 Fitur Utama

### Mobile (< 600px)

- ✅ Bottom navigation untuk quick access
- ✅ Card layout untuk asset list
- ✅ Touch-friendly buttons (min 48px)
- ✅ No zoom pada input fields (iOS)
- ✅ Hamburger menu untuk full navigation

### Tablet (600-900px)

- ✅ Mini sidebar dengan icon-only
- ✅ Grid 2 kolom untuk cards
- ✅ AppBar dengan branding
- ✅ Optimized spacing

### Desktop (> 900px)

- ✅ Full sidebar dengan labels
- ✅ Table layout untuk data kompleks
- ✅ Hover effects & animations
- ✅ Multi-column layouts

## 🛠️ Tech Stack

- **React 19** - UI library
- **Vite** - Build tool
- **Material-UI v7** - Component library
- **React Router v7** - Routing
- **Supabase** - Backend (optional)
- **Axios** - HTTP client

## 📦 Project Structure

```
frontend/
├── src/
│   ├── pages/          # Page components
│   ├── layouts/        # Layout components
│   ├── utils/          # Utility functions
│   ├── assets/         # Static assets
│   ├── App.jsx         # Main app component
│   ├── main.jsx        # Entry point
│   ├── theme.js        # MUI theme config
│   └── index.css       # Global styles
├── public/             # Public assets
└── *.md               # Documentation
```

## 🎨 Design System

### Breakpoints

```javascript
xs: 0px      // Mobile portrait
sm: 600px    // Mobile landscape / Small tablet
md: 900px    // Tablet
lg: 1200px   // Desktop
xl: 1536px   // Large desktop
```

### Colors

- Primary: `#6366f1` (Indigo)
- Secondary: `#10b981` (Emerald)
- Success: `#22c55e` (Green)
- Warning: `#f59e0b` (Amber)
- Error: `#ef4444` (Red)

### Typography

- Font: Inter (Google Fonts)
- Scale: Responsive dengan `clamp()`
- Line height: 1.6 untuk readability

## 🧪 Testing

### Browser DevTools

1. Press `F12` to open DevTools
2. Press `Ctrl+Shift+M` for Device Toolbar
3. Test different device sizes

### Real Device

1. Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Access from mobile: `http://[YOUR_IP]:5173`
3. Test all features

## 📝 Development Guidelines

### Creating Responsive Components

```javascript
import { useTheme, useMediaQuery } from "@mui/material";

function MyComponent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <Typography variant={isMobile ? "h5" : "h4"}>
        {isMobile ? "Mobile View" : "Desktop View"}
      </Typography>
    </Box>
  );
}
```

### Checklist Before Commit

- [ ] Test di mobile (< 600px)
- [ ] Test di tablet (600-900px)
- [ ] Test di desktop (> 900px)
- [ ] Touch targets min 44px
- [ ] No horizontal scroll
- [ ] No console errors

## 🚀 Build & Deploy

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📚 Resources

### Documentation

- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)
- [Material-UI Docs](https://mui.com/)
- [React Router Docs](https://reactrouter.com/)

### Internal Docs

- Start with `RESPONSIVE_SUMMARY_ID.md` untuk overview
- Use `QUICK_START_RESPONSIVE.md` untuk development
- Reference `BREAKPOINTS_GUIDE.md` untuk patterns
- Check `UI_UX_IMPROVEMENTS.md` untuk design system

## 🤝 Contributing

1. Read the documentation
2. Follow the design system
3. Test on multiple devices
4. Ensure accessibility
5. Write clean code

## 📄 License

This project is part of ITAM System.

---

**Made with ❤️ for optimal user experience across all devices**
