import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ShoppingBag, 
  SlidersHorizontal, 
  X, 
  Plus, 
  Minus, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  RotateCcw, 
  TrendingUp, 
  Layers, 
  Check, 
  Trash2,
  Sparkles,
  BarChart3,
  Package,
  Award,
  Lock
} from 'lucide-react';
import productsData from './data/products.json';
import categoriesData from './data/categories.json';
import brandsData from './data/brands.json';

// Type definitions based on scraped schema
interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  sizeSystem: string;
  sizeType: string;
  sizes: string[];
  images: string[];
  videos: string[];
  colorOptions: string[];
}

interface CartItem {
  product: Product;
  selectedSize: string;
  quantity: number;
}

export default function App() {
  // --- States ---
  const [products] = useState<Product[]>(productsData);
  const [categories] = useState(categoriesData);
  const [brands] = useState(brandsData);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');

  // Interactive UI States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Carousel Image indices for each product card
  const [carouselIndices, setCarouselIndices] = useState<Record<string, number>>({});

  // Checkout modal states
  const [checkoutStep, setCheckoutStep] = useState<'idle' | 'shipping' | 'payment' | 'success'>('idle');
  const [shippingForm, setShippingForm] = useState({ name: '', email: '', address: '', phone: '' });

  // Detail Modal Image Index
  const [detailImageIndex, setDetailImageIndex] = useState(0);
  const [detailSelectedSize, setDetailSelectedSize] = useState('');

  // --- Scraped Data Metrics ---
  const stats = useMemo(() => {
    const total = products.length;
    const avgPrice = products.reduce((acc, p) => acc + p.price, 0) / total;
    
    const brandCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    
    products.forEach(p => {
      brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });

    return {
      total,
      avgPrice: avgPrice.toFixed(2),
      brandCounts,
      categoryCounts,
    };
  }, [products]);

  // --- Filtering & Sorting Logic ---
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                            p.brand.toLowerCase().includes(search.toLowerCase()) ||
                            p.category.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        const matchesBrand = selectedBrand === 'all' || p.brand === selectedBrand;
        return matchesSearch && matchesCategory && matchesBrand;
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        return 0; // 'featured' or default
      });
  }, [products, search, selectedCategory, selectedBrand, sortBy]);

  // --- Image Fallback Helper ---
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Show a sleek fallback if direct image loading fails
    e.currentTarget.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop';
  };

  // --- Carousel Handlers ---
  const nextImage = (productId: string, imagesLength: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCarouselIndices(prev => ({
      ...prev,
      [productId]: ((prev[productId] || 0) + 1) % imagesLength
    }));
  };

  const prevImage = (productId: string, imagesLength: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCarouselIndices(prev => ({
      ...prev,
      [productId]: ((prev[productId] || 0) - 1 + imagesLength) % imagesLength
    }));
  };

  // --- Cart Actions ---
  const addToCart = (product: Product, size: string) => {
    if (!size) {
      alert('Please select a size first.');
      return;
    }
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id && item.selectedSize === size);
      if (existingIndex > -1) {
        const nextCart = [...prev];
        nextCart[existingIndex].quantity += 1;
        return nextCart;
      }
      return [...prev, { product, selectedSize: size, quantity: 1 }];
    });
    // Trigger tiny toast or feedback
    setIsCartOpen(true);
  };

  const updateCartQty = (productId: string, size: string, change: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId && item.selectedSize === size) {
          const newQty = item.quantity + change;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string, size: string) => {
    setCart(prev => prev.filter(item => !(item.product.id === productId && item.selectedSize === size)));
  };

  // --- Calculations ---
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // --- Open Product Detail Modal ---
  const openDetailModal = (product: Product) => {
    setSelectedProduct(product);
    setDetailImageIndex(0);
    setDetailSelectedSize(product.sizes[0] || '');
  };

  // --- Checkout flow actions ---
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkoutStep === 'shipping') {
      setCheckoutStep('payment');
    } else if (checkoutStep === 'payment') {
      setCheckoutStep('success');
      setCart([]); // Empty cart on success
    }
  };

  return (
    <div className="min-h-screen bg-[#05070c] text-slate-100 flex flex-col selection:bg-violet-500 selection:text-white">
      
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 glass w-full px-6 py-4 flex items-center justify-between border-b border-white/5 transition-all">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-violet-600 to-pink-500 p-2.5 rounded-xl shadow-lg shadow-violet-500/25">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-heading text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-violet-200 to-pink-300 bg-clip-text text-transparent">
              SOLESOURCE
            </span>
            <span className="hidden md:inline-block ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/10 border border-violet-500/25 text-violet-400">
              Wholesale Sourcing Hub
            </span>
          </div>
        </div>

        {/* Global Search and Utility Actions */}
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block w-64 md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search wholesale products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/60 border border-white/5 rounded-full pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-slate-500"
            />
          </div>

          <button 
            onClick={() => setIsStatsOpen(!isStatsOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
              isStatsOpen 
                ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/30' 
                : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden md:inline">Analytics</span>
          </button>

          {/* Cart Icon Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-full bg-white/5 border border-white/5 text-slate-200 hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-[10px] font-black w-5.5 h-5.5 rounded-full flex items-center justify-center border-2 border-[#05070c] animate-bounce">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-6 max-w-7xl mx-auto w-full">
        {/* Decorative Gradients */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="grid md:grid-cols-2 gap-10 items-center relative z-10">
          <div className="space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-500/20 text-violet-300">
              <Sparkles className="w-3.5 h-3.5" />
              Direct-from-factory pricing indexes
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
              Premium Footwear <br />
              <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                Wholesale Showcase
              </span>
            </h1>
            <p className="text-slate-400 text-base sm:text-lg max-w-xl leading-relaxed">
              Explore authentic factory-direct catalogs scraped live from wholesale suppliers. Browse the collection, customize order batches, and check volume discount options.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-3 px-5 py-3 rounded-2xl glass-card bg-white/[0.02]">
                <Package className="w-5 h-5 text-violet-400" />
                <div>
                  <div className="font-bold text-xl">{stats.total}</div>
                  <div className="text-xs text-slate-500">Products Loaded</div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 rounded-2xl glass-card bg-white/[0.02]">
                <Award className="w-5 h-5 text-pink-400" />
                <div>
                  <div className="font-bold text-xl">{brands.length}</div>
                  <div className="text-xs text-slate-500">Premium Brands</div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 rounded-2xl glass-card bg-white/[0.02]">
                <Lock className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="font-bold text-xl">Restricted</div>
                  <div className="text-xs text-slate-500">Pricing Policy</div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center items-center">
            {/* Display large mock image */}
            <div className="relative group max-w-md w-full">
              <div className="absolute inset-0 bg-gradient-to-tr from-violet-600 to-pink-500 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity" />
              <img
                src="https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=800&auto=format&fit=crop"
                alt="Featured Premium Shoe"
                className="w-full aspect-[4/3] object-cover rounded-3xl border border-white/10 shadow-2xl relative z-10 transform -rotate-2 hover:rotate-0 transition-all duration-500 hover:scale-102"
              />
              <div className="absolute -bottom-6 -left-6 z-20 glass p-4 rounded-2xl border border-white/10 shadow-xl max-w-[200px]">
                <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="text-xs font-extrabold text-white">4.9 Factory Rating</span>
                </div>
                <p className="text-[11px] text-slate-400">Guaranteed production and sourcing validation.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Dashboard (Collapsible) */}
      {isStatsOpen && (
        <section className="px-6 pb-8 max-w-7xl mx-auto w-full animate-fade-in">
          <div className="glass p-6 md:p-8 rounded-3xl border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <button 
                onClick={() => setIsStatsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-violet-400" />
              <h2 className="font-heading text-xl font-bold">Scraped Products Distribution Insights</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Brands Breakdown */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-pink-400" />
                  Brands Inventory
                </h3>
                <div className="space-y-3">
                  {Object.entries(stats.brandCounts).map(([brandName, count]) => {
                    const percentage = (count / stats.total) * 100;
                    return (
                      <div key={brandName} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span>{brandName || 'Unbranded / Other'}</span>
                          <span className="text-slate-400">{count} items ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="bg-gradient-to-r from-violet-500 to-pink-500 h-full rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Categories Breakdown */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-violet-400" />
                  Categories Inventory
                </h3>
                <div className="space-y-3">
                  {Object.entries(stats.categoryCounts).map(([catName, count]) => {
                    const percentage = (count / stats.total) * 100;
                    return (
                      <div key={catName} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span>{catName}</span>
                          <span className="text-slate-400">{count} items ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-violet-500 h-full rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 pb-24 grid lg:grid-cols-4 gap-8 items-start">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-6 sticky top-28 bg-[#0b0f19]/30 p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-extrabold text-lg flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-violet-400" />
              Filter Sourcing
            </h3>
            {(search || selectedCategory !== 'all' || selectedBrand !== 'all') && (
              <button 
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                  setSelectedBrand('all');
                }}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>

          <hr className="border-white/5" />

          {/* Search */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Product name, brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/5 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Category</label>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm flex justify-between items-center transition-all ${
                  selectedCategory === 'all' 
                    ? 'bg-violet-500/10 border border-violet-500/25 text-violet-400 font-semibold' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] border border-transparent'
                }`}
              >
                <span>All Categories</span>
                <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded-full text-slate-500">{products.length}</span>
              </button>
              {categories.map(cat => {
                const count = stats.categoryCounts[cat.name] || 0;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm flex justify-between items-center transition-all ${
                      selectedCategory === cat.name 
                        ? 'bg-violet-500/10 border border-violet-500/25 text-violet-400 font-semibold' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] border border-transparent'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded-full text-slate-500">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brand Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Brand</label>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedBrand('all')}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm flex justify-between items-center transition-all ${
                  selectedBrand === 'all' 
                    ? 'bg-violet-500/10 border border-violet-500/25 text-violet-400 font-semibold' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] border border-transparent'
                }`}
              >
                <span>All Brands</span>
                <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded-full text-slate-500">{products.length}</span>
              </button>
              {brands.map(brand => {
                const count = stats.brandCounts[brand.name] || 0;
                return (
                  <button
                    key={brand.id}
                    onClick={() => setSelectedBrand(brand.name)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm flex justify-between items-center transition-all ${
                      selectedBrand === brand.name 
                        ? 'bg-violet-500/10 border border-violet-500/25 text-violet-400 font-semibold' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] border border-transparent'
                    }`}
                  >
                    <span>{brand.name}</span>
                    <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded-full text-slate-500">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>


        </aside>

        {/* Product Grid Catalog Section */}
        <section className="lg:col-span-3 space-y-6">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between glass p-4 rounded-2xl border border-white/5">
            <div className="text-sm text-slate-400">
              Showing <span className="text-white font-semibold">{filteredProducts.length}</span> products matching criteria
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Sort selector */}
              <label className="text-xs font-medium text-slate-400 shrink-0">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-950/80 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500/50 w-full sm:w-44"
              >
                <option value="featured">Featured / Default</option>
                <option value="name-asc">Product Name A-Z</option>
              </select>

              {/* Mobile Filter Toggle Button */}
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-white/5 text-slate-200 border border-white/5 hover:bg-white/10"
                aria-label="Toggle Filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Product Cards Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/10 rounded-2xl border border-white/5">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-bold mb-2 text-lg">No products found</p>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">Try resetting the filter criteria or searching for something else.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => {
                const imgIdx = carouselIndices[product.id] || 0;
                const imagesCount = product.images.length;
                
                return (
                  <div 
                    key={product.id}
                    onClick={() => openDetailModal(product)}
                    className="glass-card rounded-2xl overflow-hidden flex flex-col group cursor-pointer"
                  >
                    {/* Image Area with Carousel */}
                    <div className="relative aspect-[4/5] bg-slate-950 overflow-hidden">
                      {imagesCount > 0 ? (
                        <img
                          src={product.images[imgIdx]}
                          alt={product.name}
                          onError={handleImageError}
                          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <Package className="w-12 h-12" />
                        </div>
                      )}

                      {/* Carousel Arrow Controls */}
                      {imagesCount > 1 && (
                        <>
                          <button
                            onClick={(e) => prevImage(product.id, imagesCount, e)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-950/80 border border-white/5 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-all shadow-md"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => nextImage(product.id, imagesCount, e)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-950/80 border border-white/5 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-all shadow-md"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Brand Tag Top-Left */}
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-600/90 border border-violet-500/25 text-white backdrop-blur-md">
                        {product.brand}
                      </span>

                      {/* Sourcing Badge Bottom-Right */}
                      <div className="absolute bottom-3 right-3 glass px-3 py-1 rounded-xl border border-white/10 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-violet-400" />
                        <span className="font-semibold text-[10px] text-slate-300 uppercase tracking-wider">Inquire</span>
                      </div>

                      {/* Image Indicator Dots */}
                      {imagesCount > 1 && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                          {product.images.map((_, idx) => (
                            <div 
                              key={idx}
                              className={`h-1.5 rounded-full transition-all ${
                                idx === imgIdx ? 'w-4 bg-violet-500' : 'w-1.5 bg-white/40'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Meta details */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wide mb-1">
                          {product.category}
                        </div>
                        <h4 className="font-heading font-extrabold text-slate-200 group-hover:text-violet-400 transition-colors line-clamp-1">
                          {product.name}
                        </h4>
                      </div>

                      <div className="space-y-3">
                        {/* Shoe Sizes list */}
                        {product.sizes.length > 0 && (
                          <div className="flex flex-wrap gap-1 items-center">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mr-1.5">Sizes:</span>
                            {product.sizes.slice(0, 5).map(size => (
                              <span 
                                key={size}
                                className="text-[10px] bg-slate-900 border border-white/5 px-2 py-0.5 rounded text-slate-400 font-semibold"
                              >
                                {size}
                              </span>
                            ))}
                            {product.sizes.length > 5 && (
                              <span className="text-[10px] text-slate-500 font-bold">
                                +{product.sizes.length - 5} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Interactive Add button */}
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Defaults to first size if clicked from card
                              const defaultSize = product.sizes[0] || 'One Size';
                              addToCart(product, defaultSize);
                            }}
                            className="flex-1 bg-white/5 hover:bg-violet-600 border border-white/5 hover:border-violet-500 text-slate-200 hover:text-white py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-98"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Quick Batch Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* --- CART DRAWER OVERLAY --- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />
          
          <div className="relative w-full max-w-md bg-[#070b13] border-l border-white/10 shadow-2xl h-full flex flex-col z-10 animate-fade-in">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-violet-400" />
                <h3 className="font-heading font-extrabold text-lg">Wholesale Cart</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900 border border-white/10 text-slate-400">
                  {totalItemsCount} units
                </span>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-3">
                  <ShoppingBag className="w-12 h-12 text-slate-700" />
                  <p className="font-bold">Your cart is empty</p>
                  <p className="text-xs max-w-xs">Start adding product batches to configure wholesale orders.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div 
                    key={`${item.product.id}-${item.selectedSize}`}
                    className="flex gap-4 bg-white/[0.01] border border-white/5 p-3 rounded-2xl"
                  >
                    <img 
                      src={item.product.images[0]} 
                      alt={item.product.name} 
                      onError={handleImageError}
                      className="w-16 h-16 object-contain p-1 rounded-xl bg-slate-950 shrink-0" 
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-heading font-bold text-xs text-slate-200 truncate pr-2">
                            {item.product.name}
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            Size: <span className="font-semibold text-violet-400">{item.selectedSize}</span> | Brand: {item.product.brand}
                          </p>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                          className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2.5">
                          <button 
                            onClick={() => updateCartQty(item.product.id, item.selectedSize, -1)}
                            className="p-1 rounded bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-300 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-extrabold w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateCartQty(item.product.id, item.selectedSize, 1)}
                            className="p-1 rounded bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-300 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                          Quote Request
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-white/5 space-y-4 bg-slate-950/40">
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-[11px] text-violet-300">
                    🔒 Prices are restricted. Generating a batch list will request direct-from-factory quotes.
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/5 text-[11px] text-slate-400 space-y-1">
                    <div className="flex justify-between font-bold text-slate-300">
                      <span>Total Items</span>
                      <span>{totalItemsCount} units</span>
                    </div>
                    <div>Bulk packaging: Standard wholesale cargo crating.</div>
                  </div>
                </div>

                <button 
                  onClick={() => setCheckoutStep('shipping')}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-violet-600/25 active:scale-98"
                >
                  Generate Sourcing Quote
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- CHECKOUT WORKFLOW MODAL --- */}
      {checkoutStep !== 'idle' && (
        <div className="fixed inset-0 z-55 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass p-6 md:p-8 rounded-3xl border border-white/10 max-w-md w-full relative overflow-hidden animate-fade-in">
            <button 
              onClick={() => setCheckoutStep('idle')}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {checkoutStep === 'shipping' && (
              <form onSubmit={handleCheckoutSubmit} className="space-y-6">
                <div>
                  <h3 className="font-heading font-extrabold text-xl mb-1">Shipping Details</h3>
                  <p className="text-xs text-slate-400">Provide shipping coordinates for bulk cargo delivery.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Receiver Name</label>
                    <input 
                      required 
                      type="text" 
                      value={shippingForm.name} 
                      onChange={e => setShippingForm({...shippingForm, name: e.target.value})}
                      placeholder="John Doe" 
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Corporate Email</label>
                    <input 
                      required 
                      type="email" 
                      value={shippingForm.email} 
                      onChange={e => setShippingForm({...shippingForm, email: e.target.value})}
                      placeholder="sourcing@firm.com" 
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Cargo Address</label>
                    <input 
                      required 
                      type="text" 
                      value={shippingForm.address} 
                      onChange={e => setShippingForm({...shippingForm, address: e.target.value})}
                      placeholder="100 Sourcing Way, Warehousing District" 
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Phone Contact</label>
                    <input 
                      required 
                      type="tel" 
                      value={shippingForm.phone} 
                      onChange={e => setShippingForm({...shippingForm, phone: e.target.value})}
                      placeholder="+1 (555) 123-4567" 
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500" 
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Proceed to Sourcing Validation
                </button>
              </form>
            )}

            {checkoutStep === 'payment' && (
              <form onSubmit={handleCheckoutSubmit} className="space-y-6">
                <div>
                  <h3 className="font-heading font-extrabold text-xl mb-1">Quote Request Validation</h3>
                  <p className="text-xs text-slate-400">Confirm quote request submission for verified products.</p>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">Total Sourcing Units</div>
                      <div className="font-black text-xl text-white">{totalItemsCount} Products</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-violet-500/10 border border-violet-500/25 rounded text-violet-400 uppercase">
                      Quote Pending
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-slate-950 border border-violet-500/40 flex items-center gap-3 cursor-pointer">
                      <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                      <div className="text-xs font-semibold">Generate RFQ (Request for Quote) PDF</div>
                    </div>
                    <p className="text-[10px] text-slate-500 text-center">Your quote request will be generated and validated instantaneously.</p>
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Submit Quote Request
                </button>
              </form>
            )}

            {checkoutStep === 'success' && (
              <div className="text-center py-6 space-y-6">
                <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/5">
                  <Check className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-2xl text-white mb-2">Quote Requested!</h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Excellent, <span className="font-bold text-violet-400">{shippingForm.name}</span>! Your RFQ has been submitted to factory coordinators. A detailed pricing proposal will be sent to your email.
                  </p>
                </div>
                <button 
                  onClick={() => setCheckoutStep('idle')}
                  className="w-full py-3 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Continue Sourcing
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- DYNAMIC PRODUCT DETAIL MODAL --- */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={() => setSelectedProduct(null)} />
          
          <div className="glass rounded-3xl border border-white/10 max-w-3xl w-full relative z-10 flex flex-col md:flex-row overflow-hidden max-h-[90vh] md:max-h-none animate-fade-in">
            {/* Close Button */}
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/5 transition-all z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left side: Images gallery */}
            <div className="w-full md:w-1/2 bg-slate-950 flex flex-col justify-between p-6">
              <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-slate-900">
                <img 
                  src={selectedProduct.images[detailImageIndex]} 
                  alt={selectedProduct.name} 
                  onError={handleImageError}
                  className="w-full h-full object-contain p-4 bg-slate-950" 
                />
              </div>

              {/* Thumbnails list */}
              {selectedProduct.images.length > 1 && (
                <div className="flex gap-2.5 mt-4 overflow-x-auto pb-1">
                  {selectedProduct.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setDetailImageIndex(idx)}
                      className={`relative w-14 h-14 rounded-lg overflow-hidden border shrink-0 bg-slate-900 transition-all ${
                        idx === detailImageIndex ? 'border-violet-500 scale-102' : 'border-white/5 hover:border-white/20'
                      }`}
                    >
                      <img src={img} alt="Thumbnail" onError={handleImageError} className="w-full h-full object-contain p-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right side: Configuration details */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <div className="flex gap-2 items-center mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-violet-600/20 border border-violet-500/20 text-violet-300">
                      {selectedProduct.brand}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-800 border border-white/5 text-slate-400">
                      {selectedProduct.category}
                    </span>
                  </div>
                  <h3 className="font-heading font-extrabold text-2xl text-white pr-6">
                    {selectedProduct.name}
                  </h3>
                </div>

                <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 p-3 rounded-2xl">
                  <Lock className="w-4 h-4 text-violet-400" />
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Pricing Model</div>
                    <span className="text-sm font-bold text-white">Inquire for Bulk Quote</span>
                  </div>
                </div>

                {/* Sizing selection */}
                {selectedProduct.sizes.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Size ({selectedProduct.sizeSystem})</label>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedProduct.sizes.map(size => (
                        <button
                          key={size}
                          onClick={() => setDetailSelectedSize(size)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            detailSelectedSize === size 
                              ? 'bg-violet-600 border-violet-500 text-white shadow-md' 
                              : 'bg-slate-900 border-white/5 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Wholesale cargo details */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Wholesale Specs</h4>
                  <ul className="text-xs text-slate-400 space-y-1 bg-white/[0.01] border border-white/5 p-3 rounded-2xl list-disc list-inside">
                    <li>Size System: {selectedProduct.sizeSystem || 'US'} / Size Type: {selectedProduct.sizeType || 'Shoes'}</li>
                    <li>Sourcing Index: Direct factory raw materials</li>
                    <li>Estimated shipping prep: 3-5 Business Days</li>
                  </ul>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 mt-6 flex gap-3">
                <button
                  onClick={() => addToCart(selectedProduct, detailSelectedSize)}
                  className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all shadow-md active:scale-98"
                >
                  Configure Batch Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MOBILE FILTERS DRAWER --- */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex justify-start bg-slate-950/60 backdrop-blur-sm lg:hidden">
          <div className="absolute inset-0" onClick={() => setMobileFiltersOpen(false)} />
          
          <div className="relative w-full max-w-xs bg-[#070b13] border-r border-white/10 shadow-2xl h-full flex flex-col z-10 animate-fade-in p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-extrabold text-lg flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-violet-400" />
                Filters
              </h3>
              <button 
                onClick={() => setMobileFiltersOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <hr className="border-white/5" />

            {/* Mobile Category */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Category</label>
              <div className="space-y-1">
                <button
                  onClick={() => { setSelectedCategory('all'); setMobileFiltersOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm flex justify-between items-center transition-all ${
                    selectedCategory === 'all' 
                      ? 'bg-violet-500/10 border border-violet-500/25 text-violet-400 font-semibold' 
                      : 'text-slate-400 border border-transparent'
                  }`}
                >
                  <span>All Categories</span>
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.name); setMobileFiltersOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm flex justify-between items-center transition-all ${
                      selectedCategory === cat.name 
                        ? 'bg-violet-500/10 border border-violet-500/25 text-violet-400 font-semibold' 
                        : 'text-slate-400 border border-transparent'
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Brand */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Brand</label>
              <div className="space-y-1">
                <button
                  onClick={() => { setSelectedBrand('all'); setMobileFiltersOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm flex justify-between items-center transition-all ${
                    selectedBrand === 'all' 
                      ? 'bg-violet-500/10 border border-violet-500/25 text-violet-400 font-semibold' 
                      : 'text-slate-400 border border-transparent'
                  }`}
                >
                  <span>All Brands</span>
                </button>
                {brands.map(brand => (
                  <button
                    key={brand.id}
                    onClick={() => { setSelectedBrand(brand.name); setMobileFiltersOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm flex justify-between items-center transition-all ${
                      selectedBrand === brand.name 
                        ? 'bg-violet-500/10 border border-violet-500/25 text-violet-400 font-semibold' 
                        : 'text-slate-400 border border-transparent'
                    }`}
                  >
                    <span>{brand.name}</span>
                  </button>
                ))}
              </div>
            </div>


          </div>
        </div>
      )}
      
      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-white/5 text-center text-xs text-slate-500 glass">
        <p>© 2026 SOLESOURCE. Sourced directly. Internal prototyping only.</p>
      </footer>

    </div>
  );
}
