import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  sizes: string[];
  colors: string[];
  inStock: boolean;
  rating: number;
  reviews: number;
  tags: string[];
  featured?: boolean;
}

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  getProductsByCategory: (category: string) => Product[];
  getFeaturedProducts: () => Product[];
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Mock product data
const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Ethnic Kurta Set',
    description: 'Beautiful handcrafted kurta set with intricate embroidery work. Perfect for festivals and special occasions.',
    price: 2499,
    originalPrice: 3999,
    images: [
      'https://images.pexels.com/photos/8422805/pexels-photo-8422805.jpeg',
      'https://images.pexels.com/photos/8422806/pexels-photo-8422806.jpeg'
    ],
    category: 'ethnic',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Blue', 'Red', 'Green', 'Yellow'],
    inStock: true,
    rating: 4.5,
    reviews: 128,
    tags: ['ethnic', 'festive', 'embroidered'],
    featured: true
  },
  {
    id: '2',
    name: 'Premium Cotton T-Shirt',
    description: 'Comfortable premium cotton t-shirt with modern design. Perfect for casual wear.',
    price: 899,
    originalPrice: 1299,
    images: [
      'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg',
      'https://images.pexels.com/photos/8532617/pexels-photo-8532617.jpeg'
    ],
    category: 't-shirts',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Black', 'Navy', 'Red'],
    inStock: true,
    rating: 4.2,
    reviews: 85,
    tags: ['casual', 'cotton', 'comfortable'],
    featured: true
  },
  {
    id: '3',
    name: 'Designer Dress',
    description: 'Elegant designer dress perfect for parties and formal events. Made with premium fabric.',
    price: 3499,
    originalPrice: 4999,
    images: [
      'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg',
      'https://images.pexels.com/photos/7679721/pexels-photo-7679721.jpeg'
    ],
    category: 'dresses',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Black', 'Red', 'Blue', 'Pink'],
    inStock: true,
    rating: 4.7,
    reviews: 203,
    tags: ['designer', 'formal', 'party'],
    featured: true
  },
  {
    id: '4',
    name: 'Casual Graphic Tee',
    description: 'Trendy graphic t-shirt with unique print design. Perfect for street style fashion.',
    price: 699,
    images: [
      'https://images.pexels.com/photos/9558618/pexels-photo-9558618.jpeg'
    ],
    category: 't-shirts',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Black', 'Gray'],
    inStock: true,
    rating: 4.0,
    reviews: 45,
    tags: ['graphic', 'casual', 'trendy']
  },
  {
    id: '5',
    name: 'Traditional Lehenga',
    description: 'Stunning traditional lehenga with heavy embroidery and mirror work. Perfect for weddings.',
    price: 8999,
    originalPrice: 12999,
    images: [
      'https://images.pexels.com/photos/8720680/pexels-photo-8720680.jpeg'
    ],
    category: 'ethnic',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Red', 'Pink', 'Gold', 'Green'],
    inStock: true,
    rating: 4.8,
    reviews: 156,
    tags: ['traditional', 'wedding', 'heavy work'],
    featured: true
  },
  {
    id: '6',
    name: 'Summer Maxi Dress',
    description: 'Light and breezy maxi dress perfect for summer. Comfortable and stylish.',
    price: 1999,
    originalPrice: 2999,
    images: [
      'https://images.pexels.com/photos/7679808/pexels-photo-7679808.jpeg'
    ],
    category: 'dresses',
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Blue', 'Yellow', 'Pink', 'White'],
    inStock: true,
    rating: 4.3,
    reviews: 72,
    tags: ['summer', 'maxi', 'comfortable']
  }
];

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct = {
      ...product,
      id: Date.now().toString()
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (id: string, productUpdate: Partial<Product>) => {
    setProducts(prev =>
      prev.map(product =>
        product.id === id ? { ...product, ...productUpdate } : product
      )
    );
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(product => product.id !== id));
  };

  const getProductById = (id: string) => {
    return products.find(product => product.id === id);
  };

  const getProductsByCategory = (category: string) => {
    return products.filter(product => product.category === category);
  };

  const getFeaturedProducts = () => {
    return products.filter(product => product.featured);
  };

  return (
    <ProductContext.Provider value={{
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      getProductById,
      getProductsByCategory,
      getFeaturedProducts
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};