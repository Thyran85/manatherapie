'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [isCartReady, setIsCartReady] = useState(false);
    const { data: session, status } = useSession();
    const userStorageKey = session?.user?.id ? `manatherapy_cart_user_${session.user.id}` : 'manatherapy_cart_guest';

    // Charger le panier lié à l'utilisateur courant (ou guest)
    useEffect(() => {
        if (status === 'loading') return;

        try {
            let localData = localStorage.getItem(userStorageKey);

            // Migration douce de l'ancienne clé globale vers la clé guest
            if (!localData && userStorageKey === 'manatherapy_cart_guest') {
                const legacyData = localStorage.getItem('manatherapy_cart');
                if (legacyData) {
                    localStorage.setItem(userStorageKey, legacyData);
                    localStorage.removeItem('manatherapy_cart');
                    localData = legacyData;
                }
            }

            if (localData) {
                setCartItems(JSON.parse(localData));
            } else {
                setCartItems([]);
            }
        } catch (error) {
            console.error("Erreur de lecture du localStorage pour le panier:", error);
            // Si les données sont corrompues, on nettoie
            localStorage.removeItem(userStorageKey);
            setCartItems([]);
        } finally {
            setIsCartReady(true);
        }
    }, [status, userStorageKey]);

    // Chaque fois que le panier change, le sauvegarder dans le localStorage
    useEffect(() => {
        if (!isCartReady || status === 'loading') return;
        try {
            localStorage.setItem(userStorageKey, JSON.stringify(cartItems));
        } catch (error) {
            console.error("Erreur d'écriture dans le localStorage pour le panier:", error);
        }
    }, [cartItems, userStorageKey, isCartReady, status]);

    const addToCart = (course) => {
        setCartItems(prevItems => {
            const itemExists = prevItems.find(item => item.id === course.id);
            if (itemExists) {
                // Optionnel: on pourrait augmenter la quantité ici si on vendait plusieurs fois le même item
                return prevItems; // Pour les formations, on ne l'ajoute qu'une fois
            }
            return [...prevItems, { ...course, quantity: 1 }];
        });
    };

    const removeFromCart = (courseId) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== courseId));
    };
    
    const clearCart = () => {
        setCartItems([]);
    };

    const value = {
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
