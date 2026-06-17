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

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'C.E Cavempt Graphic Tee',
    price: 4500,
    category: 'tshirts',
    sizes: ['S', 'M', 'L', 'XL'],
    images: ['https://picsum.photos/seed/tee1/400/500', 'https://picsum.photos/seed/tee1b/400/500'],
    isNew: true,
    stock: 1,
    description: 'Винтажная футболка C.E Cavempt с графическим принтом. Оригинал, состояние отличное.',
  },
  {
    id: 2,
    name: 'Number Nine Sweatshirt',
    price: 8900,
    category: 'kofty',
    sizes: ['M', 'L'],
    images: ['https://picsum.photos/seed/sw1/400/500', 'https://picsum.photos/seed/sw1b/400/500'],
    isNew: true,
    stock: 1,
    description: 'Свитшот Number Nine из архивной коллекции. Редкая находка для ценителей японского стритвера.',
  },
  {
    id: 3,
    name: 'Nike Air Force 1 White',
    price: 6200,
    category: 'sneakers',
    sizes: ['40', '41', '42', '43', '44'],
    images: ['https://picsum.photos/seed/sn1/400/500', 'https://picsum.photos/seed/sn1b/400/500'],
    isNew: false,
    stock: 2,
    description: 'Классические Nike Air Force 1 в белом цвете. Состояние 9/10.',
  },
  {
    id: 4,
    name: 'Marlboro x Number Nine Tee',
    price: 5500,
    category: 'tshirts',
    sizes: ['S', 'M', 'L'],
    images: ['https://picsum.photos/seed/tee2/400/500', 'https://picsum.photos/seed/tee2b/400/500'],
    isNew: true,
    stock: 1,
    description: 'Коллаборация Marlboro x Number Nine. Архивная футболка, очень редкая.',
  },
  {
    id: 5,
    name: 'C.E Pink Hoodie',
    price: 9800,
    category: 'kofty',
    sizes: ['M', 'L', 'XL'],
    images: ['https://picsum.photos/seed/hd1/400/500', 'https://picsum.photos/seed/hd1b/400/500'],
    isNew: true,
    stock: 1,
    description: 'Худи C.E Cavempt розового цвета. Хлопок 100%, оверсайз крой.',
  },
  {
    id: 6,
    name: 'Salomon XT-6 Black',
    price: 11500,
    category: 'sneakers',
    sizes: ['40', '41', '42', '43'],
    images: ['https://picsum.photos/seed/sn2/400/500', 'https://picsum.photos/seed/sn2b/400/500'],
    isNew: false,
    stock: 1,
    description: 'Salomon XT-6 в чёрном цвете. Культовые трейловые кроссовки, состояние 9/10.',
  },
  {
    id: 7,
    name: 'Cavempt Grey Sweatshirt',
    price: 7200,
    category: 'kofty',
    sizes: ['S', 'M', 'L'],
    images: ['https://picsum.photos/seed/sw2/400/500', 'https://picsum.photos/seed/sw2b/400/500'],
    isNew: false,
    stock: 2,
    description: 'Серый свитшот Cavempt с вышивкой на груди. Архивная вещь.',
  },
  {
    id: 8,
    name: 'Maison Margiela Replica',
    price: 13000,
    category: 'sneakers',
    sizes: ['39', '40', '41', '42', '43', '44'],
    images: ['https://picsum.photos/seed/sn3/400/500', 'https://picsum.photos/seed/sn3b/400/500'],
    isNew: true,
    stock: 1,
    description: 'Maison Margiela Replica в белом цвете. Оригинал, покупка в бутике.',
  },
]
