"use client";

import dynamic from "next/dynamic";

const Atmosphere3D = dynamic(() => import("./Atmosphere3D"), { ssr: false });

export default function AtmosphereWrapper() {
  return <Atmosphere3D />;
}
