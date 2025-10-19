"use client";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { Button } from "./ui/button";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";

export default function GoogleSignIn({ type }: { type: string }) {
  const router = useRouter();
  const { setIsLogedIn, setUser } = useUserStore();
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // tokenResponse.access_token will allow you to fetch user info
        const res = await axios.get(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );

        const userInfo = res.data;
        console.log("Google user info:", userInfo);

        // send userInfo to your backend to create/upsert user + set cookie
        const response = await axios.post("/api/auth/google", { userInfo });

        if (response.status === 200) {
          toast.success("Login successful!");
          setIsLogedIn(true);
          setUser(response.data.data);
          router.push("/");
        } else {
          toast.error("Login failed!");
        }
      } catch (err) {
        console.error("Error fetching user info", err);
      }
    },
    scope: "openid email profile", // works here
  });

  return (
    <Button variant="outline" type="button" onClick={() => login()} className="cursor-pointer hover:bg-transparent hover:border-primary">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="currentColor"
        className="icon icon-tabler icons-tabler-filled icon-tabler-brand-google"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M12 2a9.96 9.96 0 0 1 6.29 2.226a1 1 0 0 1 .04 1.52l-1.51 1.362a1 1 0 0 1 -1.265 .06a6 6 0 1 0 2.103 6.836l.001 -.004h-3.66a1 1 0 0 1 -.992 -.883l-.007 -.117v-2a1 1 0 0 1 1 -1h6.945a1 1 0 0 1 .994 .89c.04 .367 .061 .737 .061 1.11c0 5.523 -4.477 10 -10 10s-10 -4.477 -10 -10s4.477 -10 10 -10z" />
      </svg>
      {type === "login" ? "Login with Google" : "Sign up with Google"}
    </Button>
  );
}
