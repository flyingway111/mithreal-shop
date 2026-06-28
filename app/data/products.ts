export type Product = {
  id: number
  name: string
  price: number
  category: string
  sizes: string[]
  images: string[]
  isNew: boolean
  stock: number
  description?: string
}

export type Category = { id: string; name: string }

export const CATEGORIES: Category[] = [
  { id: 'all',      name: 'Все' },
  { id: 'tshirts',  name: 'Футболки' },
  { id: 'kofty',    name: 'Кофты' },
  { id: 'sneakers', name: 'Кроссовки' },
]

export const DEMO_PRODUCTS: Product[] = [
  {
    id: 9001,
    name: 'Supreme Box Logo Tee Black',
    price: 6500,
    category: 'tshirts',
    sizes: ['S', 'M', 'L', 'XL'],
    images: [],
    isNew: true,
    stock: 1,
    description: 'Классическая футболка Supreme с боксовым лого. Оригинал, состояние отличное.',
  },
  {
    id: 9002,
    name: 'Off-White Arrows Tee',
    price: 8200,
    category: 'tshirts',
    sizes: ['M', 'L', 'XL'],
    images: [],
    isNew: true,
    stock: 2,
    description: 'Футболка Off-White с принтом стрел. Хлопок 100%, оверсайз.',
  },
  {
    id: 9003,
    name: 'Stüssy Logo Tee White',
    price: 4200,
    category: 'tshirts',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    images: [],
    isNew: false,
    stock: 3,
    description: 'Белая футболка Stüssy с логотипом на груди. Классика стритвера.',
  },
  {
    id: 9004,
    name: 'Palace Triangle Tee',
    price: 5100,
    category: 'tshirts',
    sizes: ['S', 'M', 'L'],
    images: [],
    isNew: false,
    stock: 1,
    description: 'Футболка Palace с трайбал принтом. Лимитированная коллекция.',
  },
  {
    id: 9005,
    name: 'Carhartt WIP Pocket Tee',
    price: 3400,
    category: 'tshirts',
    sizes: ['M', 'L', 'XL', 'XXL'],
    images: [],
    isNew: false,
    stock: 4,
    description: 'Карманная футболка Carhartt WIP. Плотный хлопок, прямой крой.',
  },
  {
    id: 9006,
    name: 'Fear of God Essentials Hoodie',
    price: 12500,
    category: 'kofty',
    sizes: ['S', 'M', 'L', 'XL'],
    images: [],
    isNew: true,
    stock: 1,
    description: 'Худи Fear of God Essentials в сером цвете. Оверсайз, флисовая подкладка.',
  },
  {
    id: 9007,
    name: 'Champion Reverse Weave Hoodie',
    price: 5800,
    category: 'kofty',
    sizes: ['M', 'L', 'XL'],
    images: [],
    isNew: false,
    stock: 2,
    description: 'Легендарный худи Champion Reverse Weave. Толстый хлопок, не садится после стирки.',
  },
  {
    id: 9008,
    name: 'Carhartt WIP Nimbus Pullover',
    price: 7300,
    category: 'kofty',
    sizes: ['S', 'M', 'L'],
    images: [],
    isNew: true,
    stock: 1,
    description: 'Лёгкая ветровка-пуловер Carhartt WIP. Нейлон, водоотталкивающее покрытие.',
  },
  {
    id: 9009,
    name: 'New Balance 550 White Grey',
    price: 9600,
    category: 'sneakers',
    sizes: ['40', '41', '42', '43', '44', '45'],
    images: [],
    isNew: true,
    stock: 2,
    description: 'New Balance 550 в бело-серой расцветке. Оригинал, состояние 10/10.',
  },
  {
    id: 9010,
    name: 'Adidas Samba OG White Green',
    price: 8900,
    category: 'sneakers',
    sizes: ['39', '40', '41', '42', '43'],
    images: [],
    isNew: false,
    stock: 1,
    description: 'Культовые Adidas Samba OG. Кожаный верх, замшевые вставки.',
  },
  {
    id: 9011,
    name: 'Nike Dunk Low Panda',
    price: 10200,
    category: 'sneakers',
    sizes: ['40', '41', '42', '43', '44'],
    images: [],
    isNew: true,
    stock: 1,
    description: 'Nike Dunk Low Panda — чёрно-белая классика. Оригинал, не ношены.',
  },
  {
    id: 9012,
    name: 'Converse Chuck 70 High Black',
    price: 5500,
    category: 'sneakers',
    sizes: ['38', '39', '40', '41', '42', '43', '44'],
    images: [],
    isNew: false,
    stock: 3,
    description: 'Converse Chuck 70 High в чёрном. Усиленная конструкция, более мягкая подкладка.',
  },
]
