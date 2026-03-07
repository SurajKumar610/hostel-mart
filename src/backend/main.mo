import List "mo:core/List";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor {
  // Initialize authorization system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Include blob storage for photos
  include MixinStorage();

  // Types
  public type UserProfile = {
    id : Principal;
    displayName : Text;
    hostel : Text;
    contact : Text;
    createdAt : Time.Time;
  };

  public type Category = {
    #books;
    #electronics;
    #clothing;
    #furniture;
    #stationery;
    #food;
    #miscellaneous;
  };

  public type ListingType = {
    #sale;
    #trade;
    #free;
  };

  public type Condition = {
    #new;
    #likeNew;
    #good;
    #fair;
    #poor;
  };

  public type ListingStatus = {
    #active;
    #sold;
    #traded;
    #fulfilled;
  };

  public type ItemListing = {
    id : Text;
    seller : Principal;
    title : Text;
    desc : Text;
    price : ?Nat;
    category : Category;
    listingType : ListingType;
    condition : Condition;
    photos : [Storage.ExternalBlob];
    status : ListingStatus;
    createdAt : Time.Time;
  };

  public type RequestStatus = {
    #open;
    #fulfilled;
  };

  public type WantedRequest = {
    id : Text;
    requester : Principal;
    title : Text;
    desc : Text;
    category : Category;
    budget : ?Nat;
    status : RequestStatus;
    createdAt : Time.Time;
  };

  module UserProfile {
    public func compare(profile1 : UserProfile, profile2 : UserProfile) : Order.Order {
      Text.compare(profile1.displayName, profile2.displayName);
    };
  };

  module ItemListing {
    public func compare(listing1 : ItemListing, listing2 : ItemListing) : Order.Order {
      Text.compare(listing1.title, listing2.title);
    };
  };

  module WantedRequest {
    public func compare(request1 : WantedRequest, request2 : WantedRequest) : Order.Order {
      Text.compare(request1.title, request2.title);
    };
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let itemListings = Map.empty<Text, ItemListing>();
  let wantedRequests = Map.empty<Text, WantedRequest>();

  // Listings Section

  func getListingInternal(id : Text) : ?ItemListing {
    itemListings.get(id);
  };

  public query ({ caller }) func getListing(id : Text) : async ItemListing {
    switch (getListingInternal(id)) {
      case (null) { Runtime.trap("Listing not found. ") };
      case (?listing) { listing };
    };
  };

  func addListingInternal(listing : ItemListing) {
    itemListings.add(listing.id, listing);
  };

  public shared ({ caller }) func createListing(title : Text, desc : Text, price : ?Nat, category : Category, listingType : ListingType, condition : Condition, photoKeys : [Storage.ExternalBlob]) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create listings");
    };

    let id = title.concat(Time.now().toText());

    let newListing : ItemListing = {
      id;
      seller = caller;
      title;
      desc;
      price;
      category;
      listingType;
      condition;
      photos = photoKeys;
      status = #active;
      createdAt = Time.now();
    };

    // Update open requests whose category matches the new listing
    let allOpenRequests = wantedRequests.values().filter(
      func(request) {
        request.status == #open and request.category == newListing.category
      }
    );

    for (openRequest in allOpenRequests) {
      let updatedRequest = {
        openRequest with
        status = #fulfilled;
      };
      wantedRequests.add(openRequest.id, updatedRequest);
    };

    addListingInternal(newListing);

    id;
  };

  public shared ({ caller }) func updateListingPhotos(listingId : Text, photoKeys : [Storage.ExternalBlob]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update listings");
    };
    switch (getListingInternal(listingId)) {
      case (null) { Runtime.trap("Listing not found") };
      case (?listing) {
        if (listing.seller != caller) {
          Runtime.trap("Unauthorized: only the owner can update their listings. ");
        };
        let updatedListing = {
          listing with
          photos = photoKeys;
        };
        addListingInternal(updatedListing);
      };
    };
  };

  public shared ({ caller }) func markListingStatus(listingId : Text, status : ListingStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update listings");
    };
    switch (getListingInternal(listingId)) {
      case (null) { Runtime.trap("Listing not found") };
      case (?listing) {
        if (listing.seller != caller) {
          Runtime.trap("Unauthorized: only the owner can update their listings. ");
        };
        let updatedListing = {
          listing with
          status;
        };
        addListingInternal(updatedListing);
      };
    };
  };

  public shared ({ caller }) func deleteListing(listingId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete listings");
    };
    switch (getListingInternal(listingId)) {
      case (null) { Runtime.trap("Listing not found") };
      case (?listing) {
        if (listing.seller != caller) {
          Runtime.trap("Unauthorized: only the owner can delete their listings. ");
        };
        itemListings.remove(listingId);
      };
    };
  };

  public query ({ caller }) func getListingsBySeller(sellerId : Principal) : async [ItemListing] {
    let iter = itemListings.values().filter(
      func(listing) {
        listing.seller == sellerId and listing.status == #active
      }
    );
    iter.toArray().sort();
  };

  // Requests Section

  func getRequestInternal(id : Text) : ?WantedRequest {
    wantedRequests.get(id);
  };

  public query ({ caller }) func getRequest(id : Text) : async WantedRequest {
    switch (getRequestInternal(id)) {
      case (null) { Runtime.trap("Request not found. ") };
      case (?request) { request };
    };
  };

  func addRequestInternal(request : WantedRequest) {
    wantedRequests.add(request.id, request);
  };

  public shared ({ caller }) func createRequest(title : Text, desc : Text, category : Category, budget : ?Nat) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create requests");
    };
    let id = title.concat(Time.now().toText());
    let newRequest : WantedRequest = {
      id;
      requester = caller;
      title;
      desc;
      category;
      budget;
      status = #open;
      createdAt = Time.now();
    };
    addRequestInternal(newRequest);
    id;
  };

  public shared ({ caller }) func markRequestFulfilled(requestId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update requests");
    };
    switch (getRequestInternal(requestId)) {
      case (null) { Runtime.trap("Request not found") };
      case (?request) {
        if (request.requester != caller) {
          Runtime.trap("Unauthorized: only the owner can update their requests. ");
        };
        let updatedRequest = {
          request with
          status = #fulfilled;
        };
        addRequestInternal(updatedRequest);
      };
    };
  };

  public shared ({ caller }) func deleteRequest(requestId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete requests");
    };
    switch (getRequestInternal(requestId)) {
      case (null) { Runtime.trap("Request not found") };
      case (?request) {
        if (request.requester != caller) {
          Runtime.trap("Unauthorized: only the owner can delete their requests. ");
        };
        wantedRequests.remove(requestId);
      };
    };
  };

  public query ({ caller }) func getRequestsByRequester(requesterId : Principal) : async [WantedRequest] {
    let iter = wantedRequests.values().filter(
      func(request) {
        request.requester == requesterId
      }
    );
    iter.toArray().sort();
  };

  // User profile

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.get(caller);
  };
};
