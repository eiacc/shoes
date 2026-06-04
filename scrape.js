import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://chinawholesalesourcing.com/hcgi/platform';
const FILE_BASE_URL = `${BASE_URL}/api/files`;

const POCKETBASE_API = {
  products: `${BASE_URL}/api/collections/products/records?perPage=500`,
  categories: `${BASE_URL}/api/collections/categories/records?perPage=100`,
  brands: `${BASE_URL}/api/collections/brands/records?perPage=100`,
};

async function fetchData(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch data from ${url}: ${response.statusText}`);
  }
  return response.json();
}

async function scrape() {
  try {
    console.log('Starting scrape of China Wholesale Sourcing API...');

    // Ensure src/data directory exists
    const dataDir = path.join(process.cwd(), 'src', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 1. Fetch Brands
    console.log('Fetching brands...');
    const brandsData = await fetchData(POCKETBASE_API.brands);
    const brands = brandsData.items.map(brand => ({
      id: brand.id,
      name: brand.name,
      logoUrl: brand.logo ? `${FILE_BASE_URL}/${brand.collectionId}/${brand.id}/${brand.logo}` : '',
    }));
    fs.writeFileSync(path.join(dataDir, 'brands.json'), JSON.stringify(brands, null, 2));
    console.log(`Saved ${brands.length} brands to src/data/brands.json`);

    // 2. Fetch Categories
    console.log('Fetching categories...');
    const categoriesData = await fetchData(POCKETBASE_API.categories);
    const categories = categoriesData.items.map(category => ({
      id: category.id,
      name: category.name.trim(),
      description: category.description,
    }));
    fs.writeFileSync(path.join(dataDir, 'categories.json'), JSON.stringify(categories, null, 2));
    console.log(`Saved ${categories.length} categories to src/data/categories.json`);

    // 3. Fetch Products
    console.log('Fetching products...');
    const productsData = await fetchData(POCKETBASE_API.products);
    const products = productsData.items.map(product => {
      // Map mainimages to full URLs
      const images = (product.mainimages || []).map(
        img => `${FILE_BASE_URL}/${product.collectionId}/${product.id}/${img}`
      );
      
      const videos = (product.mainvideos || []).map(
        vid => `${FILE_BASE_URL}/${product.collectionId}/${product.id}/${vid}`
      );

      return {
        id: product.id,
        name: product.product_name.trim(),
        brand: product.brand,
        category: product.category,
        price: Number(product.price),
        sizeSystem: product.size_system,
        sizeType: product.size_type,
        sizes: product.sizes_array || [],
        images,
        videos,
        colorOptions: product.color_options || [],
        created: product.created,
        updated: product.updated,
      };
    });
    fs.writeFileSync(path.join(dataDir, 'products.json'), JSON.stringify(products, null, 2));
    console.log(`Saved ${products.length} products to src/data/products.json`);

    console.log('Scrape completed successfully!');
  } catch (error) {
    console.error('Error during scrape:', error);
    process.exit(1);
  }
}

scrape();
