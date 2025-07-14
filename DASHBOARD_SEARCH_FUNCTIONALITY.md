


Prompt for Building a Mobile-Responsive SabiOps Dashboard

Objective
Enhance the existing SabiOps dashboard deployed on Vercel at sabiops.vercel.app to create a mobile-responsive, role-based dashboard with green and white branding colors. The dashboard must be visually appealing, functional, and aligned with the needs of Nigerian SMEs as specified in the SabiOps MVP Product Requirements Document (PRD). It should cater to three user roles—Owners, Admins, and Salespeople—with role-specific features and permissions, replacing the current "wack" dashboard.

Existing Context





The project uses React with Tailwind CSS for the frontend, deployed on Vercel.



Backend is hosted at sabiops-backend.vercel.app with Supabase as the database (project name: "sabiops").



The current dashboard exists but is unsatisfactory and needs a complete overhaul.

Branding and Design Requirements





Color Scheme: Use green (#10b981, #059669, #34d399) for headers, buttons, and accents, and white (#ffffff, #f7fafc) for backgrounds and text where appropriate.



Typography: Use Inter or Roboto for body text and Montserrat or Poppins for headings.



Icons: Incorporate icons from react-icons or lucide-react for actions, metrics, and navigation.



Whitespace: Ensure sufficient spacing between elements for clarity and readability.



Animations: Add subtle animations (e.g., hover effects, loading states) using Tailwind CSS or Framer Motion for a polished feel.

Role-Based Requirements (Per PRD)
The dashboard must dynamically render content based on the user’s role, fetched via the /api/users/{id} endpoint or stored in the app’s state (e.g., React Context or Redux).





Owners:





Full access to all features: subscription management, team management, sales, expenses, inventory, customers, and analytics.



Display trial/upgrade status (e.g., "6 days left in trial") and a crown icon for weekly plan owners.



Metrics: Revenue, expenses, profit, subscription usage (e.g., invoices created vs. limit).



Widgets: Team management, referral earnings, subscription upgrades.



Admins:





Access to operational data: sales, expenses, inventory, customers, and analytics.



No subscription or team management features.



Widgets: Product management, customer management, sales reports.



Salespeople:





Sales-focused UI: sales data, transaction history, customer interactions.



No access to subscription, team, or expense management.



Widgets: Daily sales, customer lists, transaction history.

Dashboard Components and Layout





Navigation:





Desktop: Sidebar with role-based menu items (e.g., Owners see "Team" and "Pricing").



Mobile: Bottom navigation bar with icons; collapse sidebar into a hamburger menu.



Use Tailwind’s responsive classes (e.g., hidden md:block for sidebar).



Metrics Section:





Cards displaying key metrics (e.g., revenue, expenses, profit) with green accents.



Owners see subscription status; others see operational metrics only.



Quick Actions:





Buttons like "Create Invoice," "Add Expense," or "Add Product" styled in green (bg-emerald-600 hover:bg-emerald-700 text-white).



Role-based visibility (e.g., only Owners/Admins see "Add Product").



Charts and Analytics:





Use recharts to create:





Line chart for revenue/expense trends.



Bar chart for top products or expense categories.



Subscription usage chart (Owners only).



Style with green shades and white backgrounds.



Tables:





Transaction history, customer lists, and product inventory with filters (date, category, etc.).



Mobile: Collapse into expandable cards or enable horizontal scrolling.



Use alternating row colors (e.g., bg-white and bg-emerald-50).



Forms:





Inline forms for adding/editing customers, products, or expenses using react-hook-form.



Green submit buttons and white input fields with green borders.



Alerts:





In-app toasts for low stock, nearing invoice limits (Owners only), or overdue invoices.



Green for info, red for warnings.

Mobile Responsiveness





Stack cards and charts vertically on mobile using Tailwind’s flex-col and sm:grid classes.



Bottom navigation bar with icons (e.g., Dashboard, Sales, Customers) on mobile.



Adjust font sizes and padding with responsive classes (e.g., text-sm sm:text-base).

Technical Implementation





Framework: Enhance the existing React app with Tailwind CSS.



State Management: Use React Context or Redux to manage user role and data.



API Integration: Fetch data from existing endpoints (e.g., /api/reports/sales, /api/transactions).



Role-Based Rendering: Conditionally render components (e.g., {user.role === 'Owner' && <SubscriptionWidget />}).



Charts: Integrate recharts for analytics, styled with Tailwind.



Performance: Lazy-load charts/tables with React.lazy and optimize with memoization.



Accessibility: Use semantic HTML, ensure contrast (e.g., white text on green buttons), and support keyboard navigation.

Design Inspiration





Green header (bg-emerald-600 text-white) with the SabiOps logo.



White cards (bg-white shadow-md border-emerald-200) with green accents.



Green buttons (bg-emerald-600 hover:bg-emerald-700 text-white) for primary actions.



Subtle green-to-white gradients for section backgrounds.

Deliverables





A revamped, mobile-responsive dashboard replacing the current one.



Role-based UI reflecting Owners, Admins, and Salespeople permissions.



Green and white branding consistently applied.



Deployed updates on Vercel with optimized performance and accessibility.
