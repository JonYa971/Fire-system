"use client";

import dynamic from "next/dynamic";

// 通过 dynamic 禁用 real_map 的服务端渲染
const RealMap = dynamic(() => import("./real_map"), {
  ssr: false,
});

export default RealMap;
