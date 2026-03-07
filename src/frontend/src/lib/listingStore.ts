/**
 * Simple in-memory + localStorage store for discovered listing/request IDs.
 * Since there's no getAllListings endpoint, we cache IDs as users browse.
 */

const LISTING_IDS_KEY = "he_listing_ids";
const SELLER_IDS_KEY = "he_seller_ids";
const REQUEST_IDS_KEY = "he_request_ids";

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function saveSet(key: string, set: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    // ignore storage errors
  }
}

export const listingStore = {
  getListingIds(): Set<string> {
    return loadSet(LISTING_IDS_KEY);
  },
  addListingId(id: string) {
    const s = loadSet(LISTING_IDS_KEY);
    s.add(id);
    saveSet(LISTING_IDS_KEY, s);
  },
  getSellerIds(): Set<string> {
    return loadSet(SELLER_IDS_KEY);
  },
  addSellerId(id: string) {
    const s = loadSet(SELLER_IDS_KEY);
    s.add(id);
    saveSet(SELLER_IDS_KEY, s);
  },
  getRequestIds(): Set<string> {
    return loadSet(REQUEST_IDS_KEY);
  },
  addRequestId(id: string) {
    const s = loadSet(REQUEST_IDS_KEY);
    s.add(id);
    saveSet(REQUEST_IDS_KEY, s);
  },
};
