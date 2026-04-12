"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesState {
  favorites: string[];
  isFavorite: (conditionId: string) => boolean;
  toggle: (conditionId: string) => void;
}

export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      isFavorite: (conditionId) => get().favorites.includes(conditionId),
      toggle: (conditionId) =>
        set((state) => ({
          favorites: state.favorites.includes(conditionId)
            ? state.favorites.filter((id) => id !== conditionId)
            : [...state.favorites, conditionId],
        })),
    }),
    { name: "polyalpha-favorites" }
  )
);
