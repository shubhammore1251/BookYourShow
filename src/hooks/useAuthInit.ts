"use client"

import { useEffect } from "react"
import { useUserStore } from "@/store/userStore"
import axios from "axios"

export async function useAuthInit() {
  const { setUser, logout, setIsLogedIn } = useUserStore()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.get("/api/auth/verify-session", { withCredentials: true })
        if (res.data?.user) {
            setIsLogedIn(true);
            setUser(res.data.user)
        }
        else logout()
      } catch (err) {
        logout()
      }
    }

    checkSession()
  }, [setUser, logout])
}
