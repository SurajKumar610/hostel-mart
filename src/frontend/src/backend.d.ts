import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Time = bigint;
export interface WantedRequest {
    id: string;
    status: RequestStatus;
    title: string;
    requester: Principal;
    desc: string;
    createdAt: Time;
    category: Category;
    budget?: bigint;
}
export interface ItemListing {
    id: string;
    status: ListingStatus;
    title: string;
    desc: string;
    createdAt: Time;
    seller: Principal;
    listingType: ListingType;
    category: Category;
    price?: bigint;
    photos: Array<ExternalBlob>;
    condition: Condition;
}
export interface UserProfile {
    id: Principal;
    contact: string;
    displayName: string;
    createdAt: Time;
    hostel: string;
}
export enum Category {
    clothing = "clothing",
    miscellaneous = "miscellaneous",
    food = "food",
    furniture = "furniture",
    stationery = "stationery",
    books = "books",
    electronics = "electronics"
}
export enum Condition {
    new_ = "new",
    fair = "fair",
    good = "good",
    poor = "poor",
    likeNew = "likeNew"
}
export enum ListingStatus {
    active = "active",
    fulfilled = "fulfilled",
    traded = "traded",
    sold = "sold"
}
export enum ListingType {
    trade = "trade",
    free = "free",
    sale = "sale"
}
export enum RequestStatus {
    fulfilled = "fulfilled",
    open = "open"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createListing(title: string, desc: string, price: bigint | null, category: Category, listingType: ListingType, condition: Condition, photoKeys: Array<ExternalBlob>): Promise<string>;
    createRequest(title: string, desc: string, category: Category, budget: bigint | null): Promise<string>;
    deleteListing(listingId: string): Promise<void>;
    deleteRequest(requestId: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getListing(id: string): Promise<ItemListing>;
    getListingsBySeller(sellerId: Principal): Promise<Array<ItemListing>>;
    getRequest(id: string): Promise<WantedRequest>;
    getRequestsByRequester(requesterId: Principal): Promise<Array<WantedRequest>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markListingStatus(listingId: string, status: ListingStatus): Promise<void>;
    markRequestFulfilled(requestId: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateListingPhotos(listingId: string, photoKeys: Array<ExternalBlob>): Promise<void>;
}
