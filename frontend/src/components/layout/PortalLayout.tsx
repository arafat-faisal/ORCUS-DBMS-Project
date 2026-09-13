"use client";

import React from "react";
import { AppShell } from "./AppShell";

interface PortalLayoutProps {
  children: React.ReactNode;
}

export function PortalLayout({ children }: PortalLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
