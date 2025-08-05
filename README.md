# D-EDI E-commerce Dashboard

A modern, full-stack e-commerce dashboard built with React, TypeScript, and Supabase.

## Features

- 🔐 **Authentication**: Secure user authentication with Supabase Auth
- 📊 **Dashboard**: Real-time analytics and overview
- 🛍️ **Product Management**: Add, edit, and delete products
- 📦 **Order Management**: Track and manage customer orders
- 📱 **Responsive Design**: Mobile-first design with Tailwind CSS
- 🔄 **Real-time Updates**: Live data synchronization with Supabase
- 🎨 **Modern UI**: Clean, professional interface with smooth animations

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: React Hooks
- **UI Components**: Headless UI, Heroicons
- **Notifications**: React Hot Toast
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your Supabase project:
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key

4. Create a `.env.local` file and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

5. Set up the database schema (see Database Schema section below)

6. Start the development server:
   ```bash
   npm run dev
   ```

## Database Schema

Create the following tables in your Supabase project:

### Profiles Table
```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text not null,
  avatar_url text,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;

-- Policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
```

### Products Table
```sql
create table products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text not null,
  price integer not null,
  original_price integer,
  shipping_charges integer default 0,
  image_url text not null,
  category text not null,
  sizes text[] default '{}',
  colors text[] default '{}',
  in_stock boolean default true,
  rating numeric(2,1) default 0,
  reviews integer default 0,
  tags text[] default '{}',
  featured boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table products enable row level security;

-- Policies
create policy "Anyone can view products" on products for select using (true);
create policy "Only admins can insert products" on products for insert using (
  exists (
    select 1 from profiles 
    where profiles.id = auth.uid() 
    and profiles.role = 'admin'
  )
);
create policy "Only admins can update products" on products for update using (
  exists (
    select 1 from profiles 
    where profiles.id = auth.uid() 
    and profiles.role = 'admin'
  )
);
create policy "Only admins can delete products" on products for delete using (
  exists (
    select 1 from profiles 
    where profiles.id = auth.uid() 
    and profiles.role = 'admin'
  )
);
```

### Orders Table
```sql
create table orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  customer_name text not null,
  email text not null,
  phone text not null,
  address text not null,
  payment_method text not null,
  amount integer not null,
  status text default 'pending' check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  items jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table orders enable row level security;

-- Policies
create policy "Users can view own orders" on orders for select using (auth.uid() = user_id);
create policy "Users can create own orders" on orders for insert using (auth.uid() = user_id);
create policy "Admins can view all orders" on orders for select using (
  exists (
    select 1 from profiles 
    where profiles.id = auth.uid() 
    and profiles.role = 'admin'
  )
);
create policy "Admins can update orders" on orders for update using (
  exists (
    select 1 from profiles 
    where profiles.id = auth.uid() 
    and profiles.role = 'admin'
  )
);
```

## Project Structure

```
src/
├── components/
│   ├── Layout/          # Layout components (Sidebar, Header, etc.)
│   └── UI/              # Reusable UI components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and configurations
├── pages/               # Page components
│   ├── Auth/           # Authentication pages
│   ├── Dashboard/      # Dashboard pages
│   ├── Products/       # Product management pages
│   └── Orders/         # Order management pages
└── types/              # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.