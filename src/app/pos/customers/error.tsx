"use client"

import { NexoraError } from "@/components/shared/NexoraError"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <NexoraError title="Customers Error" message={error.message} errorType="UNKNOWN_ERROR" reset={reset} />
}
