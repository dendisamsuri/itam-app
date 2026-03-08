# 🚀 Quick Start - Responsive Development

## Untuk Developer Baru

### 1. Setup & Run

```bash
cd frontend
npm install
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`

### 2. Test Responsiveness

#### Di Browser (Chrome DevTools)

1. Tekan `F12` untuk buka DevTools
2. Tekan `Ctrl+Shift+M` untuk toggle Device Toolbar
3. Pilih device preset atau custom size
4. Test di berbagai ukuran:
   - iPhone SE (375px) - Mobile kecil
   - iPhone 12 Pro (390px) - Mobile standard
   - iPad (768px) - Tablet
   - Desktop (1920px) - Desktop

#### Di Real Device

1. Cari IP address komputer:

   ```bash
   # Windows
   ipconfig

   # Mac/Linux
   ifconfig
   ```

2. Akses dari mobile: `http://[YOUR_IP]:5173`

3. Test semua fitur:
   - [ ] Navigation (bottom nav di mobile)
   - [ ] Forms (tidak zoom di iOS)
   - [ ] Buttons (mudah di-tap)
   - [ ] Tables (scroll horizontal)
   - [ ] Dialogs (tidak terpotong)

## Untuk Developer yang Update Code

### Membuat Komponen Responsif

#### 1. Import Hook

```javascript
import { useTheme, useMediaQuery } from "@mui/material";

const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
```

#### 2. Conditional Rendering

```javascript
// Tampilkan komponen berbeda per device
{
  isMobile ? <MobileView /> : <DesktopView />;
}

// Hide/show komponen
{
  !isMobile && <DesktopOnlyFeature />;
}
```

#### 3. Responsive Props

```javascript
// Grid
<Grid size={{ xs: 12, sm: 6, md: 4 }}>

// Spacing
<Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>

// Typography
<Typography variant={isMobile ? 'h5' : 'h4'}>

// Button size
<Button size={isMobile ? 'small' : 'medium'}>
```

### Checklist Sebelum Commit

#### Visual

- [ ] Test di mobile (< 600px)
- [ ] Test di tablet (600-900px)
- [ ] Test di desktop (> 900px)
- [ ] Tidak ada horizontal scroll
- [ ] Spacing konsisten
- [ ] Typography readable

#### Interaction

- [ ] Touch targets min 44px (48px mobile)
- [ ] Buttons mudah di-tap
- [ ] Forms tidak trigger zoom di iOS
- [ ] Hover effects hanya di desktop
- [ ] Loading states jelas
- [ ] Error messages helpful

#### Performance

- [ ] No console errors
- [ ] No console warnings
- [ ] Animations smooth
- [ ] Images optimized
- [ ] Bundle size reasonable

## Common Patterns

### 1. Responsive Layout

```javascript
function MyPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <Typography variant={isMobile ? "h5" : "h4"}>Page Title</Typography>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <MainContent />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Sidebar />
        </Grid>
      </Grid>
    </Box>
  );
}
```

### 2. Responsive Table/Cards

```javascript
function DataList({ items }) {
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return isMobile ? (
    // Card layout untuk mobile
    <Grid container spacing={2}>
      {items.map((item) => (
        <Grid size={12} key={item.id}>
          <Card>
            <CardContent>
              <Typography variant="h6">{item.name}</Typography>
              <Typography variant="body2">{item.description}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  ) : (
    // Table layout untuk desktop
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Description</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
```

### 3. Responsive Dialog

```javascript
function MyDialog({ open, onClose }) {
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          mx: { xs: 1, sm: "auto" },
          borderRadius: { xs: 4, sm: 6 },
        },
      }}
    >
      <DialogTitle>Title</DialogTitle>
      <DialogContent>Content</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
```

### 4. Responsive Form

```javascript
function MyForm() {
  return (
    <Box component="form">
      <Grid container spacing={2}>
        {/* Full width di mobile, half di desktop */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="First Name"
            sx={{
              "& .MuiInputBase-root": {
                minHeight: { xs: 48, sm: 44 },
              },
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Last Name"
            sx={{
              "& .MuiInputBase-root": {
                minHeight: { xs: 48, sm: 44 },
              },
            }}
          />
        </Grid>

        <Grid size={12}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ minHeight: { xs: 48, sm: 44 } }}
          >
            Submit
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
```

## Debugging Tips

### 1. Layout Issues

```javascript
// Tambahkan border untuk debug
<Box sx={{ border: '1px solid red' }}>

// Check computed styles di DevTools
// Right click > Inspect > Computed tab
```

### 2. Breakpoint Issues

```javascript
// Log current breakpoint
console.log("isMobile:", isMobile);
console.log("isTablet:", isTablet);

// Check window width
console.log("Window width:", window.innerWidth);
```

### 3. Touch Target Issues

```javascript
// Visualize touch targets
<Button sx={{
  minWidth: 44,
  minHeight: 44,
  border: '1px dashed red' // Debug only
}}>
```

## Common Mistakes to Avoid

### ❌ Don't

```javascript
// Fixed sizes
<Box sx={{ width: 300 }}>

// Hover effects di mobile
<Card sx={{
  '&:hover': { transform: 'scale(1.05)' }
}}>

// Small touch targets
<IconButton sx={{ width: 32, height: 32 }}>

// Fixed font sizes
<Typography sx={{ fontSize: '14px' }}>
```

### ✅ Do

```javascript
// Responsive sizes
<Box sx={{ width: { xs: '100%', md: 300 } }}>

// Conditional hover
<Card sx={{
  '@media (hover: hover)': {
    '&:hover': { transform: 'scale(1.05)' }
  }
}}>

// Proper touch targets
<IconButton sx={{
  minWidth: { xs: 48, sm: 44 },
  minHeight: { xs: 48, sm: 44 }
}}>

// Responsive typography
<Typography variant="body2">
```

## Performance Tips

### 1. Lazy Load Heavy Components

```javascript
const HeavyComponent = lazy(() => import("./HeavyComponent"));

<Suspense fallback={<CircularProgress />}>
  <HeavyComponent />
</Suspense>;
```

### 2. Memoize Expensive Calculations

```javascript
const filteredItems = useMemo(() => {
  return items.filter((item) => item.active);
}, [items]);
```

### 3. Debounce Search

```javascript
const [searchQuery, setSearchQuery] = useState("");

useEffect(() => {
  const timer = setTimeout(() => {
    // Perform search
  }, 300);

  return () => clearTimeout(timer);
}, [searchQuery]);
```

## Resources

### Documentation

- [MUI Breakpoints](https://mui.com/material-ui/customization/breakpoints/)
- [MUI useMediaQuery](https://mui.com/material-ui/react-use-media-query/)
- [MUI Grid v2](https://mui.com/material-ui/react-grid2/)

### Internal Docs

- `RESPONSIVE_FEATURES.md` - Fitur lengkap
- `BREAKPOINTS_GUIDE.md` - Panduan breakpoints
- `UI_UX_IMPROVEMENTS.md` - Peningkatan UI/UX
- `RESPONSIVE_SUMMARY_ID.md` - Ringkasan (Bahasa Indonesia)

### Tools

- Chrome DevTools Device Mode
- Firefox Responsive Design Mode
- [BrowserStack](https://www.browserstack.com/) - Real device testing
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Performance audit

## Getting Help

### Check Console

```bash
# Browser console (F12)
# Look for errors or warnings
```

### Check Diagnostics

```bash
# Run linter
npm run lint

# Check for type errors (if using TypeScript)
npm run type-check
```

### Ask for Help

1. Describe the issue
2. Include screenshots
3. Mention device/browser
4. Share code snippet
5. Show console errors

## Quick Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run linter

# Testing
# Open in browser and test manually
# Use DevTools Device Mode
# Test on real devices
```

## Next Steps

1. ✅ Read `RESPONSIVE_SUMMARY_ID.md` untuk overview
2. ✅ Study `BREAKPOINTS_GUIDE.md` untuk patterns
3. ✅ Review existing pages untuk examples
4. ✅ Test di real devices
5. ✅ Start building!

---

**Happy Coding! 🚀**

Jika ada pertanyaan, check dokumentasi atau tanya team lead.
