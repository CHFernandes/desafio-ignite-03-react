import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data }: { data: Stock } = await api.get(`stock/${productId}`);
      const stockAmount = data.amount;
      const updatedCart = [...cart];
      const foundProduct = updatedCart.find( product => product.id === productId);

      if (foundProduct) {
        if (stockAmount < foundProduct.amount + 1) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        foundProduct.amount += 1;

        setCart(updatedCart);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
        return;
      }

      const { data:productData }: {data: Product} = await api.get(`products/${productId}`);

      const newProduct: Product = {
        id: productData.id,
        title: productData.title,
        amount: 1,
        image: productData.image,
        price: productData.price
      };

      updatedCart.push(newProduct);

      setCart(updatedCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const foundProduct = cart.find(product => product.id === productId);

      if (!foundProduct) {
        toast.error('Erro na remoção do produto');
        return
      }

      const newCart = cart.filter(product => product.id !== productId);

      setCart(newCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if ( amount < 1 ) {
        return;
      }

      const { data }: { data: Stock } = await api.get(`stock/${productId}`);
      const stockAmount = data.amount;

      if (stockAmount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = [...cart];
      const foundProduct = updatedCart.find( product => product.id === productId);

      if (!foundProduct){
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }

      foundProduct.amount = amount
      
      setCart(updatedCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
