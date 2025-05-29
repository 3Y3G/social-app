"use client"

import type React from "react"

import type * as z from "zod"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

import { loginSchema } from "@/lib/validation"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FormError } from "@/components/form-error"
import { FormSuccess } from "@/components/form-success"
import Link from "next/link"

export const LoginForm = () => {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | undefined>("")
  const [success, setSuccess] = useState<string | undefined>("")

  const [requires2FA, setRequires2FA] = useState(false)
  const [tempUserId, setTempUserId] = useState<string | null>(null)
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [isEmailVerified, setIsEmailVerified] = useState(true)

  const router = useRouter()

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })


  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    setError("")
    setSuccess("")

    startTransition(() => {
      setTimeout(() => {
        setSuccess("Email sent!")
      }, 3000)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(undefined)

    const email = form.getValues("email")
    const password = form.getValues("password")

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        if (result.error === "ACCOUNT_LOCKED") {
          setError("Акаунтът е заключен поради многократни неуспешни опити за вход. Моля, опитайте по-късно.")
        } else if (result.error === "EMAIL_NOT_VERIFIED") {
          setError("Моля, потвърдете имейла си преди да влезете в акаунта си.")
          setIsEmailVerified(false)
        } else if (result.error === "REQUIRES_2FA") {
          setRequires2FA(true)
          setTempUserId(null)
        } else {
          setError("Невалиден имейл или парола")
        }
      } else {
        router.push("/")
        router.refresh()
      }
    } catch (error) {
      setError("Възникна грешка. Моля, опитайте отново.")
    }
  }

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(undefined)

    if (!tempUserId) {
      setError("Възникна грешка. Моля, опитайте отново.")
      return
    }

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: tempUserId, token: twoFactorCode }),
      })

      const data = await response.json()

      if (data.success) {
        // Complete the sign in process
        const result = await signIn("credentials", {
          redirect: false,
          email: form.getValues("email"),
          password: form.getValues("password"),
          twoFactorToken: twoFactorCode,
        })

        if (result?.error) {
          setError("Възникна грешка при завършването на входа")
        } else {
          router.push("/")
          router.refresh()
        }
      } else {
        setError(data.error || "Невалиден код")
      }
    } catch (error) {
      setError("Възникна грешка. Моля, опитайте отново.")
    }
  }

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <h2 className="text-2xl font-semibold text-center">Вход</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Имейл</Label>
              <Input {...form.register("email")} disabled={isPending} placeholder="ivan@example.com" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Парола</Label>
              <Input {...form.register("password")} placeholder="******" type="password" disabled={isPending} />
            </div>
          </div>
          <FormError message={error} />
          <FormSuccess message={success} />
          <Button disabled={isPending} className="w-full" type="submit">
            Вход
          </Button>
        </form>
        {requires2FA && (
          <form onSubmit={handle2FASubmit}>
            <CardContent className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Двуфакторна автентификация</h3>
                <p className="text-sm text-gray-600">Въведете 6-цифрения код от вашето приложение за автентификация</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="2fa">Код за автентификация</Label>
                <Input
                  id="2fa"
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Потвърди
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setRequires2FA(false)
                  setTempUserId(null)
                  setTwoFactorCode("")
                }}
              >
                Отказ
              </Button>
            </CardContent>
          </form>
        )}

        {!isEmailVerified && (
          <CardFooter>
            <div className="w-full text-center">
              <Button variant="outline" className="w-full">
                <Link href="/auth/resend-verification">Изпрати отново имейл за потвърждение</Link>
              </Button>
            </div>
          </CardFooter>
        )}
      </CardContent>
      <CardFooter>
        <div className="text-center text-sm space-y-2">
          <Link href="/auth/forgot-password" className="text-blue-600 hover:underline">
            Забравили сте паролата си?
          </Link>
          <div>
            Нямате акаунт?{" "}
            <Link href="/register" className="text-blue-600 hover:underline">
              Регистрирайте се тук
            </Link>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
