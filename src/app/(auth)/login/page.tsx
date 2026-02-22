import type { Metadata } from "next";
import SplashLogin from "@/components/auth/SplashLogin";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return <SplashLogin />;
}
