import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { DashboardPage } from "@/pages/DashboardPage";
import { HomePage } from "@/pages/HomePage";
import { ListingDetailPage } from "@/pages/ListingDetailPage";
import { MyProfilePage } from "@/pages/MyProfilePage";
import { PostListingPage } from "@/pages/PostListingPage";
import { PostRequestPage } from "@/pages/PostRequestPage";
import { PublicProfilePage } from "@/pages/PublicProfilePage";
import { RequestBoardPage } from "@/pages/RequestBoardPage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

// Root layout route
const rootRoute = createRootRoute({
  component: () => (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
      <Toaster position="top-right" richColors />
    </div>
  ),
});

// Pages
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const listingDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/listing/$id",
  component: ListingDetailPage,
});

const postListingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/post-listing",
  component: PostListingPage,
});

const requestsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/requests",
  component: RequestBoardPage,
});

const postRequestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/post-request",
  component: PostRequestPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const publicProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile/$principal",
  component: PublicProfilePage,
});

const myProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: MyProfilePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  listingDetailRoute,
  postListingRoute,
  requestsRoute,
  postRequestRoute,
  dashboardRoute,
  myProfileRoute,
  publicProfileRoute,
]);

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
