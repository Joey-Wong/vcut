const routes = [
  {
    path: "/",
    redirect: {
      name: "mvOverlay",
    },
  },
  {
    path: "/mvOverlay",
    name: "mvOverlay",
    component: () => import("@/views/MvOverlay"),
  },
  {
    path: "/mvMerge",
    name: "mvMerge",
    component: () => import("@/views/MvMerge"),
  },
  {
    path: "/mvSpeed",
    name: "mvSpeed",
    component: () => import("@/views/MvSpeed"),
  },
  {
    path: "/mvCompress",
    name: "mvCompress",
    component: () => import("@/views/MvCompress"),
  },
];

export default routes;
