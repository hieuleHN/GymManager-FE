import { DashboardLayout } from '../../components/DashboardLayout';
import { Button } from '@mui/material';
import { ShoppingCart, Star } from 'lucide-react';
import { useState } from 'react';

const categories = [
  { id: 'all', name: 'Tất cả' },
  { id: 'protein', name: 'Whey Protein' },
  { id: 'preworkout', name: 'Prä-Main' },
  { id: 'drinks', name: 'Nước uống' },
  { id: 'snacks', name: 'Snack' },
  { id: 'vitamins', name: 'Vitamin' }
];

const products = [
  {
    id: 1,
    name: 'Casein Gold Standard',
    price: 1400000,
    category: 'protein',
    rating: 4.8,
    reviews: 132,
    image: 'https://images.unsplash.com/photo-1579722820308-d74e571900a9?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 2,
    name: 'Whey Isolate Jong',
    price: 1750000,
    category: 'protein',
    rating: 5.0,
    reviews: 89,
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 3,
    name: 'Prä-Main 250',
    price: 750000,
    category: 'preworkout',
    rating: 4.7,
    reviews: 56,
    image: 'https://images.unsplash.com/photo-1599932155279-19dfe19d15e5?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 4,
    name: 'Nước khoáng Lavie',
    price: 8000,
    category: 'drinks',
    rating: 4.5,
    reviews: 234,
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 5,
    name: 'Shaker Bottle 700ml',
    price: 120000,
    category: 'snacks',
    rating: 4.6,
    reviews: 98,
    image: 'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 6,
    name: 'Găng tay tập Gym',
    price: 150000,
    category: 'snacks',
    rating: 4.7,
    reviews: 124,
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 7,
    name: 'Dây kháng lực',
    price: 115000,
    category: 'snacks',
    rating: 4.4,
    reviews: 67,
    image: 'https://images.unsplash.com/photo-1598971457999-ca4ef48a6b33?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 8,
    name: 'Thanh Protein Bar',
    price: 25000,
    category: 'snacks',
    rating: 4.6,
    reviews: 145,
    image: 'https://images.unsplash.com/photo-1604480133435-25b9184b00e7?auto=format&fit=crop&q=80&w=300'
  }
];

export function Products() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Sản phẩm</h1>
          <p className="text-slate-600">Mua sắm các sản phẩm hỗ trợ tập luyện</p>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-2.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                selectedCategory === category.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square overflow-hidden bg-slate-50">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-900 mb-2 line-clamp-1">{product.name}</h3>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold text-slate-900">{product.rating}</span>
                  </div>
                  <span className="text-xs text-slate-500">({product.reviews})</span>
                </div>

                <p className="text-xl font-bold text-indigo-600 mb-3">
                  {product.price.toLocaleString('vi-VN')}đ
                </p>

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<ShoppingCart className="w-4 h-4" />}
                  sx={{
                    bgcolor: '#4f46e5',
                    '&:hover': { bgcolor: '#4338ca' },
                    textTransform: 'none',
                    borderRadius: 2
                  }}
                >
                  Thêm vào giỏ
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
