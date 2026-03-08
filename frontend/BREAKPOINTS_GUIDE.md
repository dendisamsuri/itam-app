# 📐 Panduan Breakpoints ITAM System

## Breakpoints Utama

```javascript
{
  xs: 0,      // Extra Small - Mobile Portrait
  sm: 600,    // Small - Mobile Landscape / Small Tablet
  md: 900,    // Medium - Tablet
  lg: 1200,   // Large - Desktop
  xl: 1536,   // Extra Large - Large Desktop
}
```

## Penggunaan di Komponen

### 1. useMediaQuery Hook

```javascript
import { useTheme, useMediaQuery } from "@mui/material";

const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // < 600px
const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md")); // 600-900px
const isDesktop = useMediaQuery(theme.breakpoints.up("md")); // > 900px
```

### 2. Responsive Props (MUI Grid)

```javascript
<Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
  {/* Full width mobile, half tablet, 1/3 desktop, 1/4 large */}
</Grid>
```

### 3. sx Prop Responsive Values

```javascript
<Box sx={{
  p: { xs: 2, sm: 3, md: 4 },           // Padding
  fontSize: { xs: '0.875rem', md: '1rem' }, // Font size
  display: { xs: 'none', md: 'block' }   // Visibility
}}>
```

## Layout Patterns

### Mobile First (< 600px)

```javascript
// Stack vertically
<Stack direction="column" spacing={2}>

// Full width buttons
<Button fullWidth>

// Bottom navigation
<BottomNavigation>

// Card layout
<Grid container spacing={2}>
  <Grid size={12}>
    <Card />
  </Grid>
</Grid>
```

### Tablet (600-900px)

```javascript
// 2 column grid
<Grid container spacing={3}>
  <Grid size={{ xs: 12, sm: 6 }}>
    <Card />
  </Grid>
</Grid>

// Mini sidebar
<Drawer sx={{ width: 80 }}>

// Horizontal layout
<Stack direction="row" spacing={2}>
```

### Desktop (> 900px)

```javascript
// Multi-column
<Grid container spacing={4}>
  <Grid size={{ md: 8 }}>
    <MainContent />
  </Grid>
  <Grid size={{ md: 4 }}>
    <Sidebar />
  </Grid>
</Grid>

// Table layout
<TableContainer>
  <Table>

// Full sidebar
<Drawer sx={{ width: 260 }}>
```

## Conditional Rendering

### Show/Hide Components

```javascript
// Hide on mobile
{
  !isMobile && <DesktopOnlyComponent />;
}

// Show only on mobile
{
  isMobile && <MobileOnlyComponent />;
}

// Different components per breakpoint
{
  isMobile ? <MobileView /> : <DesktopView />;
}
```

### Conditional Layouts

```javascript
{
  isMobile || isTablet ? (
    // Card layout for mobile/tablet
    <Grid container spacing={2}>
      {items.map((item) => (
        <Grid size={{ xs: 12, sm: 6 }} key={item.id}>
          <Card>{item.name}</Card>
        </Grid>
      ))}
    </Grid>
  ) : (
    // Table layout for desktop
    <TableContainer>
      <Table>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
```

## Typography Responsive

### Using clamp()

```javascript
// In theme.js
h4: {
  fontSize: 'clamp(1.75rem, 4vw, 2.125rem)',
  // Min: 1.75rem (28px)
  // Preferred: 4% of viewport width
  // Max: 2.125rem (34px)
}
```

### Using Breakpoint Props

```javascript
<Typography
  variant="h4"
  sx={{
    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }
  }}
>
```

## Spacing Scale

```javascript
// Responsive padding
sx={{
  p: { xs: 2, sm: 3, md: 4 }
  // xs: 16px
  // sm: 24px
  // md: 32px
}}

// Responsive margin
sx={{
  mb: { xs: 2, md: 4 }
  // xs: 16px bottom margin
  // md: 32px bottom margin
}}
```

## Touch Targets

### Minimum Sizes

```javascript
// Buttons
minHeight: { xs: 48, sm: 44 }  // Larger on mobile

// Icon Buttons
minWidth: { xs: 48, sm: 44 }
minHeight: { xs: 48, sm: 44 }

// List Items
padding: { xs: '12px 16px', sm: '10px 16px' }
minHeight: { xs: 52, sm: 48 }
```

## Common Patterns

### Responsive Container

```javascript
<Box sx={{
  maxWidth: { xs: '100%', sm: 600, md: 900, lg: 1200 },
  mx: 'auto',
  px: { xs: 2, sm: 3, md: 4 }
}}>
```

### Responsive Dialog

```javascript
<Dialog
  fullScreen={isMobile}
  maxWidth="sm"
  fullWidth
  PaperProps={{
    sx: {
      mx: { xs: 1, sm: 'auto' },
      borderRadius: { xs: 4, sm: 6 }
    }
  }}
>
```

### Responsive Navigation

```javascript
// Mobile: Bottom Nav
{isMobile && (
  <BottomNavigation>
    <BottomNavigationAction />
  </BottomNavigation>
)}

// Tablet: Mini Sidebar
{isTablet && (
  <Drawer sx={{ width: 80 }}>
)}

// Desktop: Full Sidebar
{isDesktop && (
  <Drawer sx={{ width: 260 }}>
)}
```

## CSS Media Queries

### In CSS Files

```css
/* Mobile First */
.element {
  padding: 16px;
}

/* Tablet */
@media (min-width: 600px) {
  .element {
    padding: 24px;
  }
}

/* Desktop */
@media (min-width: 900px) {
  .element {
    padding: 32px;
  }
}
```

### Hide/Show Classes

```css
/* Hide on mobile */
.hide-mobile {
  display: block;
}

@media (max-width: 600px) {
  .hide-mobile {
    display: none !important;
  }
}

/* Show only on mobile */
.show-mobile {
  display: none;
}

@media (max-width: 600px) {
  .show-mobile {
    display: block !important;
  }
}
```

## Testing Checklist

### Mobile (< 600px)

- [ ] Bottom navigation visible
- [ ] Cards full width
- [ ] Buttons min 48px height
- [ ] Text inputs 16px font
- [ ] No horizontal scroll
- [ ] Touch targets comfortable

### Tablet (600-900px)

- [ ] Mini sidebar or AppBar
- [ ] 2 column grid
- [ ] Buttons min 44px height
- [ ] Proper spacing
- [ ] Content not too wide

### Desktop (> 900px)

- [ ] Full sidebar with labels
- [ ] Table layout optimal
- [ ] Hover effects work
- [ ] Multi-column layouts
- [ ] Proper max-width

## Quick Reference

| Device  | Breakpoint | Layout    | Navigation   | Grid   |
| ------- | ---------- | --------- | ------------ | ------ |
| Mobile  | < 600px    | Stack     | Bottom Nav   | 1 col  |
| Tablet  | 600-900px  | Grid      | Mini Sidebar | 2 col  |
| Desktop | > 900px    | Multi-col | Full Sidebar | 3+ col |

## Best Practices

1. ✅ Always test on real devices
2. ✅ Use mobile-first approach
3. ✅ Ensure min 44px touch targets
4. ✅ Use 16px font on mobile inputs
5. ✅ Test both portrait & landscape
6. ✅ Consider safe areas (notches)
7. ✅ Optimize images for mobile
8. ✅ Test slow network conditions
9. ✅ Validate accessibility
10. ✅ Use semantic HTML

## Resources

- [MUI Breakpoints Docs](https://mui.com/material-ui/customization/breakpoints/)
- [MUI useMediaQuery](https://mui.com/material-ui/react-use-media-query/)
- [MUI Grid v2](https://mui.com/material-ui/react-grid2/)
- [Responsive Design Guidelines](https://web.dev/responsive-web-design-basics/)
