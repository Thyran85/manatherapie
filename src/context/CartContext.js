'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    // Au chargement initial, essayer de récupérer le panier depuis le localStorage
    useEffect(() => {
        try {
            const localData = localStorage.getItem('manatherapy_cart');
            if (localData) {
                setCartItems(JSON.parse(localData));
            }
        } catch (error) {
            console.error("Erreur de lecture du localStorage pour le panier:", error);
            // Si les données sont corrompues, on nettoie
            localStorage.removeItem('manatherapy_cart');
        }
    }, []);

    // Chaque fois que le panier change, le sauvegarder dans le localStorage
    useEffect(() => {
        try {
            localStorage.setItem('manatherapy_cart', JSON.stringify(cartItems));
        } catch (error) {
            console.error("Erreur d'écriture dans le localStorage pour le panier:", error);
        }
    }, [cartItems]);

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