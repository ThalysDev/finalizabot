# TESTING GUIDE - FinalizaBOT

## Responsiveness Testing Checklist

### Mobile Devices (375px - 425px)

- [ ] Hero section stacks properly
- [ ] Buttons are touch-friendly (min 44x44px)
- [ ] Text is readable without zoom
- [ ] Demo card metrics are visible
- [ ] Navigation collapses to mobile menu
- [ ] Footer links are clickable

### Tablets (768px - 1024px)

- [ ] Grid layouts adapt to 2 columns
- [ ] Benefits section shows 2-3 columns
- [ ] Demo card scales properly
- [ ] Touch targets remain adequate
- [ ] Images load correctly

### Desktop (1024px - 1280px)

- [ ] Full layout with all columns visible
- [ ] Benefits section shows 3 columns
- [ ] How it works shows proper connector lines
- [ ] Demo card is centered and sized well
- [ ] All hover states work

### Desktop Large (1280px+)

- [ ] Max-width constraints respected
- [ ] Container padding appropriate
- [ ] No horizontal scrolling
- [ ] Typography scales properly

## Cross-Browser Testing

### Chrome/Chromium

- [ ] Latest version tested
- [ ] Mobile emulation works
- [ ] Dev tools responsive design
- [ ] All CSS features render
- [ ] JavaScript execution correct

### Firefox

- [ ] Latest version tested
- [ ] Flex layouts display correctly
- [ ] CSS Grid works
- [ ] Box models match Chrome
- [ ] Fonts render consistently

### Safari

- [ ] Latest macOS version
- [ ] iOS Safari mobile testing
- [ ] Webkit prefixes work
- [ ] Touch events respond
- [ ] Performance acceptable

### Edge

- [ ] Chromium-based Edge works
- [ ] Similar to Chrome behavior
- [ ] CSS compatibility verified

## Accessibility Testing

### Keyboard Navigation

- [ ] Tab key navigates all interactive elements
- [ ] Shift+Tab reverses navigation order
- [ ] Focus indicator visible on all elements
- [ ] Enter/Space activates buttons
- [ ] Form submission with keyboard

### Screen Reader (NVDA/JAWS/VoiceOver)

- [ ] Headings announced correctly
- [ ] Alt text for all images
- [ ] Form labels associated with inputs
- [ ] Button purposes clear
- [ ] Navigation structure logical
- [ ] Dynamic content announced

### Color & Contrast

- [ ] Text contrast ratio >= 4.5:1
- [ ] Large text contrast >= 3:1
- [ ] Color not sole means of communication
- [ ] Focus indicators visible

### Semantic HTML

- [ ] Proper heading hierarchy (h1 > h2 > h3)
- [ ] One h1 per page
- [ ] Landmark elements (main, nav, footer)
- [ ] List elements used for lists
- [ ] Links have descriptive text

## Performance Testing

### Lighthouse Audit

Run: `npm run build && npm run start`
Then use Chrome DevTools → Lighthouse

**Targets:**

- Performance: >= 90
- Accessibility: >= 95
- Best Practices: >= 95
- SEO: >= 95

### Load Times

- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- Total Blocking Time (TBT): < 200ms

### Bundle Size

- Main JavaScript: < 150KB (gzipped)
- CSS: < 30KB (gzipped)
- Images optimized: WebP/AVIF formats

## Functionality Testing

### Authentication (Clerk)

- [ ] Sign Up flow works
- [ ] Sign In flow works
- [ ] Sign Out clears session
- [ ] Protected routes redirect to login
- [ ] User button displays in header
- [ ] Clerk UI components render

### Navigation

- [ ] Links navigate correctly
- [ ] Back button works
- [ ] Anchor links scroll to sections
- [ ] Route transitions smooth

### Forms

- [ ] Input validation works
- [ ] Error messages display
- [ ] Success feedback appears
- [ ] Form submission functions

### API Endpoints

- [ ] GET /api/matches returns data
- [ ] GET /api/matches/[id] returns detail
- [ ] GET /api/players/[id] returns player data
- [ ] Error handling for missing IDs

## Analytics Testing

### Events Tracked

- [ ] Page views recorded
- [ ] CTA clicks tracked
- [ ] Form submissions logged
- [ ] User interactions captured

### Data Verification

- [ ] Events appear in GA4
- [ ] Timestamps correct
- [ ] User sessions tracked
- [ ] Conversion funnel visible

## Manual Test Cases

### Test Case 1: New User Landing

1. Visit http://localhost:3000
2. Verify hero section displays
3. See Call-to-Action buttons
4. Click "Comece Agora" → redirects to /sign-up
5. Verify demo card section visible

### Test Case 2: Sign Up Flow

1. Click "Criar Conta Grátis"
2. Enter email and password
3. Verify account created
4. Redirected to dashboard
5. See UserButton in header

### Test Case 3: Responsive Design

1. Open DevTools → Toggle Device Toolbar
2. Test: 375px, 768px, 1024px, 1280px
3. Verify layout adapts
4. Touch targets remain adequate
5. Text readable without zoom

### Test Case 4: Performance

1. Open DevTools → Network tab
2. Reload page (Cmd/Ctrl + Shift + R)
3. Check resource sizes
4. Verify images are optimized
5. Check waterfall timing

## Automated Test Setup

### Jest + React Testing Library

```bash
npm install --save-dev jest @testing-library/react
```

### Example Test

```typescript
import { render, screen } from '@testing-library/react';
import HeroSection from '@/components/landing/HeroSection';

describe('HeroSection', () => {
  it('renders headline', () => {
    render(<HeroSection />);
    expect(screen.getByText(/Analise finalizações/i)).toBeInTheDocument();
  });

  it('shows sign-up button', () => {
    render(<HeroSection />);
    const button = screen.getByRole('button', { name: /Comece Agora/i });
    expect(button).toBeInTheDocument();
  });
});
```

## Bug Reporting Template

```markdown
## Bug Report

**Title:** [Clear title]

**Device/Browser:**

- OS: [e.g., Windows 11, macOS]
- Browser: [e.g., Chrome 120]
- Viewport: [e.g., 1920x1080]

**Steps to Reproduce:**

1. ...
2. ...
3. ...

**Expected Behavior:**
...

**Actual Behavior:**
...

**Screenshots/Videos:**
[Attach if possible]

**Console Errors:**
[Any error logs]
```

## Quick Test Commands

```bash
# Build for production
npm run build

# Test performance
npm run build && npm run start

# Check TypeScript
npx tsc --noEmit

# Lint code
npm run lint

# Format code
npx prettier --write .

# Run accessibility check
npx axe-core
```

## Test Environment Setup

### Local Testing

```bash
cd C:\Users\Thalys\finalizabot
npm run dev
# Visit http://localhost:3000
```

### Production Build Testing

```bash
npm run build
npm run start
# Visit http://localhost:3000
```

### Database Testing

```bash
npx prisma studio
# Verify data in UI
```

## Reporting Results

After testing, create a report:

```markdown
# Test Report - [Date]

## Summary

- Tests Passed: X/Y
- Critical Issues: 0
- Minor Issues: 0

## Device Coverage

- ✅ Mobile
- ✅ Tablet
- ✅ Desktop

## Browser Coverage

- ✅ Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Edge

## Accessibility

- ✅ Keyboard Navigation
- ✅ Screen Readers
- ✅ Contrast Ratios

## Performance

- ✅ Lighthouse >= 90
- ✅ Core Web Vitals Met

## Sign-Off

Tested by: [Name]
Date: [Date]
Status: Ready for Deployment ✅
```
