"use client";

import axios from "axios";
import useSWR from "swr";
const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const useSwrFetcher = (url, params = {}) => {
  const { data, error, mutate, isLoading } = useSWR(
    url,
    async () => {
      const response = await axios.get(baseURL + url, { params });
      return response.data;
    },
    {
      // Configure SWR to cache data indefinitely (or for a very long time)
      revalidateOnFocus: false, // Prevents refetching when window regains focus
      revalidateOnReconnect: false, // Prevents refetching when reconnecting
      shouldRetryOnError: false, // Disables retry on error
      // dedupingInterval: 100000000, // Large number to prevent revalidation for a long period
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
};
