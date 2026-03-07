import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Storage "blob-storage/Storage";

module {
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

  // Old actor type
  type OldActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    itemListings : Map.Map<Text, ItemListing>;
    wantedRequests : Map.Map<Text, WantedRequest>;
  };

  // New actor type
  type NewActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    itemListings : Map.Map<Text, ItemListing>;
    wantedRequests : Map.Map<Text, WantedRequest>;
  };

  // Migration function called by the main actor via the with-clause
  public func run(old : OldActor) : NewActor {
    {
      userProfiles = old.userProfiles;
      itemListings = old.itemListings;
      wantedRequests = old.wantedRequests;
    };
  };
};
